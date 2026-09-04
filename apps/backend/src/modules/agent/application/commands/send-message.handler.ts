import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { PROFILE_REPOSITORY, ProfileRepository } from '../../../profile/domain/ports/profile.repository';
import { findOrCreateProfile, findProfile } from '../../../profile/application/commands/find-or-create-profile';
import { Profile } from '../../../profile/domain/profile.aggregate';
import { resolveShortcut, ShortcutFact } from '../../../profile/domain/services/shortcut';
import {
  ComparableVehicle,
  VehicleComparisonPolicy,
} from '../../../vehicles/domain/vehicle-comparison.policy';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../../vehicles/domain/ports/vehicle.repository';
import { LEAD_REPOSITORY, LeadRepository } from '../../../leads/domain/ports/lead.repository';
import { Lead } from '../../../leads/domain/lead.aggregate';
import { validateCatalogGrounding } from '../../domain/services/catalog-grounding-guard';
import { inferFunnelStage } from '../../domain/services/funnel-stage';
import { assertCanRequestContact } from '../../domain/services/contact-gate';
import { isQualifiedBuyer } from '../../domain/services/buyer-qualification';
import { verifyVerdict, Verdict } from '../../domain/services/verdict-verifier';
import { FunnelStageReachedEvent } from '../../domain/events/funnel-stage-reached.event';
import { VerdictDeliveredEvent } from '../../domain/events/verdict-delivered.event';
import { ComparisonPerformedEvent } from '../../domain/events/comparison-performed.event';
import { Conversation } from '../../domain/conversation.aggregate';
import { CONVERSATION_REPOSITORY, ConversationRepository } from '../../domain/ports/conversation.repository';
import { ConversationStatus } from '../../domain/conversation-status';
import { CandidateVehicle, LLM_PORT, LlmPort, LlmReply, ProfileSummary } from '../../domain/ports/llm.port';
import { resolveConversation } from './resolve-conversation';
import { SendMessageCommand } from './send-message.command';

export interface SendMessageResult {
  conversationId: number;
  reply: string;
  // CEB-36-UI-03: para que el frontend pueda renderizar tarjetas de
  // vehículo sin tener que volver a consultar toda la Conversación.
  referencedVehicleIds: number[];
  // Presente solo cuando el Agente llegó a recomendar Y esa recomendación
  // pasó la verificación contra los Ganadores de comparación. Su ausencia es
  // un estado normal, no un error: sin ganador claro no hay Veredicto.
  verdict: Verdict | null;
  // Respuestas pre-formuladas para tapear en vez de escribir. Vacío cuando el
  // turno no termina en pregunta.
  suggestedReplies: string[];
  // Qué sabe ya el Agente, para que la interfaz no ofrezca Atajos que
  // preguntan algo ya respondido — el mismo criterio que la regla 7 del prompt
  // le impone al modelo.
  known: { need: boolean; budget: boolean };
}

// Respuestas fijas — nunca el texto libre del LLM — cuando se detecta una
// violación de invariante. Esto es lo que hace determinista el rechazo
// (INV-1, INV-2, INV-6): no importa qué haya generado el modelo en
// `message`, si la señal estructurada dispara, el comprador nunca ve ese
// texto. Ver la limitación de prueba documentada en CEB-36/CEB-48: esto
// prueba que la capa de reemplazo funciona, no que el LLM "nunca" fallará
// en marcar la señal correctamente.
const OUT_OF_SCOPE_MESSAGE =
  'Solo puedo ayudarte con la búsqueda y comparación de vehículos de nuestro catálogo — ¿en qué modelo o característica te gustaría que te ayude?';
const DISCOUNT_OR_FINANCING_MESSAGE =
  'Los descuentos y condiciones de financiamiento los define nuestro equipo comercial, no yo — puedo seguir ayudándote a encontrar el carro que mejor se ajuste a lo que buscas.';
// El prompt pide un máximo, pero el modelo no siempre lo respeta —se vieron 7
// en una respuesta— y una torre de botones tapa la conversación. Se recorta acá
// porque es la única forma de garantizarlo: mismo criterio que el resto del
// módulo, el modelo propone y el código impone.
const MAX_SUGGESTED_REPLIES = 4;

const GROUNDING_FAILURE_MESSAGE =
  'Disculpa, no tengo esa información exacta en el catálogo ahora mismo — ¿quieres que te muestre las opciones disponibles?';

@CommandHandler(SendMessageCommand)
export class SendMessageHandler implements ICommandHandler<SendMessageCommand> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly repository: ConversationRepository,
    @Inject(VEHICLE_REPOSITORY) private readonly vehicleRepository: VehicleRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepository: ProfileRepository,
    @Inject(LEAD_REPOSITORY) private readonly leadRepository: LeadRepository,
    @Inject(LLM_PORT) private readonly llm: LlmPort,
    private readonly eventPublisher: EventPublisher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SendMessageCommand): Promise<SendMessageResult> {
    const conversation = await resolveConversation(this.repository, command.sessionId, command.conversationId);
    const tracked = this.eventPublisher.mergeObjectContext(conversation);

    // CEB-81 / INV-12: el hecho del Atajo se conoce ANTES de llamar al
    // modelo, así que se aplica antes de calcular la Etapa y de armar el
    // prompt. Si entrara por el camino de los hechos extraídos (que se
    // aplican DESPUÉS de la respuesta), el Agente armaría su turno sin saber
    // lo que el comprador acaba de tapear y repreguntaría lo ya respondido.
    const shortcutFact = resolveShortcut(command.shortcutId);
    let trackedProfile: Profile | null = null;
    if (shortcutFact) {
      trackedProfile = this.eventPublisher.mergeObjectContext(
        await findOrCreateProfile(this.profileRepository, command.sessionId),
      );
      this.applyShortcutFact(trackedProfile, shortcutFact);
      await this.profileRepository.save(trackedProfile);
      trackedProfile.commit();
    } else {
      // ADR-0012: lectura pura. Sin Atajo todavía no hay nada que guardar, y
      // conversar sin declarar nada no debe crear Perfil.
      const existing = await findProfile(this.profileRepository, command.sessionId);
      trackedProfile = existing ? this.eventPublisher.mergeObjectContext(existing) : null;
    }

    const stageBeforeThisTurn = inferFunnelStage(tracked, trackedProfile);

    const publishedVehicles = await this.vehicleRepository.findAllPublished();
    const candidateVehicles = this.toCandidateVehicles(publishedVehicles);
    const llmReply = await this.llm.reply({
      turns: tracked.turns,
      buyerMessage: command.message,
      candidateVehicles,
      currentStage: stageBeforeThisTurn,
      profileSummary: this.buildProfileSummary(trackedProfile),
    });

    const { message: finalMessage, referencedVehicleIds } = await this.enforceInvariants(llmReply);

    // CEB-82 / INV-8: el LLM redacta, el dominio audita. Un Veredicto que no
    // se sostiene en los Ganadores de comparación se descarta acá y nunca
    // llega al comprador — el turno sigue igual, sin error visible.
    // Se evalúa sobre el Perfil de ANTES de aplicar los hechos de este turno:
    // así el Veredicto nunca puede caer en el mismo turno en que el comprador
    // recién contó qué busca. Un recomendador que recomienda antes de escuchar
    // no está recomendando.
    const verdict = this.verifyProposedVerdict(
      llmReply,
      referencedVehicleIds,
      publishedVehicles,
      isQualifiedBuyer(trackedProfile),
    );

    tracked.recordTurn(
      command.message,
      finalMessage,
      llmReply.intentSignal ?? null,
      referencedVehicleIds,
      // Basta con que haya venido un shortcutId: el comprador tapeó. Que ese
      // tap además llevara un hecho determinista es otra cosa (los Atajos de
      // uso/presupuesto lo llevan; una respuesta pre-formulada no).
      command.shortcutId ? 'TAP' : 'TYPE',
    );
    await this.repository.save(tracked);
    tracked.commit();

    // CEB-44: el Perfil se nutre independientemente de si la Conversación
    // llega a buen puerto (INV-3). ADR-0012: pero solo se materializa si hay
    // algo declarado que guardar.
    if (this.hasDeclaredFacts(llmReply)) {
      trackedProfile ??= this.eventPublisher.mergeObjectContext(
        await findOrCreateProfile(this.profileRepository, command.sessionId),
      );
      this.applyExtractedFacts(trackedProfile, llmReply, shortcutFact);
      // CEB-85: sin gate. El gate sigue rigiendo si el Agente PIDE contacto,
      // no si se guarda el que el comprador ofrece por su cuenta.
      if (llmReply.extractedContact) {
        trackedProfile.captureContact(
          llmReply.extractedContact.firstName,
          llmReply.extractedContact.lastName,
          llmReply.extractedContact.phone,
        );
      }
      await this.profileRepository.save(trackedProfile);
      trackedProfile.commit();
    }

    // CEB-85 / INV-9: se intenta en CADA turno, no solo en el que trajo el
    // contacto — así el Contacto ofrecido antes de que se hablara de ningún
    // Vehículo se materializa en cuanto aparece el primero.
    await this.maybeCreateLead(tracked, trackedProfile);

    if (verdict) {
      this.eventBus.publish(
        new VerdictDeliveredEvent(
          tracked.id as number,
          verdict.recommendedVehicleId,
          verdict.comparedVehicleIds,
          verdict.decisiveField,
        ),
      );
    }
    // Adopción, separada del éxito: el Agente puede contrastar un par y no
    // llegar a Veredicto (regla 9).
    if (referencedVehicleIds.length === 2) {
      this.eventBus.publish(new ComparisonPerformedEvent(command.sessionId, referencedVehicleIds));
    }

    // El evento se publica desde acá (no desde Conversation.apply()) porque
    // inferFunnelStage necesita a Profile, de otro contexto — ver
    // agent/domain/events/funnel-stage-reached.event.ts. Se recalcula
    // DESPUÉS del turno (a diferencia de stageBeforeThisTurn) porque es
    // para el log de Analytics, no para el prompt.
    const stageAfterThisTurn = inferFunnelStage(tracked, trackedProfile);
    this.eventBus.publish(new FunnelStageReachedEvent(tracked.id as number, stageAfterThisTurn));

    return {
      conversationId: tracked.id as number,
      reply: finalMessage,
      referencedVehicleIds,
      verdict,
      // Se descartan si hubo violación de invariante: el mensaje se reemplazó
      // por uno fijo, así que las sugerencias del modelo ya no corresponden.
      suggestedReplies: llmReply.boundaryViolation
        ? []
        : (llmReply.suggestedReplies ?? []).slice(0, MAX_SUGGESTED_REPLIES),
      known: {
        need: (trackedProfile?.needs.length ?? 0) > 0,
        budget: trackedProfile?.budgetRange != null,
      },
    };
  }

  private applyShortcutFact(profile: Profile, fact: ShortcutFact): void {
    if (fact.kind === 'NEED') {
      profile.captureNeed(fact.category, 'capturado por un Atajo');
      return;
    }
    profile.captureBudget(fact.min, fact.max);
  }

  private hasDeclaredFacts(llmReply: LlmReply): boolean {
    return Boolean(
      llmReply.extractedNeed ||
        llmReply.extractedMotivation ||
        llmReply.extractedObjection ||
        llmReply.extractedBudget ||
        llmReply.extractedContact,
    );
  }

  // Un Veredicto es siempre sobre un par. Se reusa VehicleComparisonPolicy de
  // Catalog en vez de recalcular quién gana qué acá — la dirección de "mejor"
  // es conocimiento de Catalog (ADR-0006) y duplicarla las dejaría divergir.
  private verifyProposedVerdict(
    llmReply: LlmReply,
    referencedVehicleIds: number[],
    publishedVehicles: Awaited<ReturnType<VehicleRepository['findAllPublished']>>,
    buyerQualified: boolean,
  ): Verdict | null {
    if (!llmReply.proposedVerdict || referencedVehicleIds.length !== 2) return null;

    const pair = referencedVehicleIds
      .map((id) => publishedVehicles.find((v) => v.id === id))
      .filter((v): v is (typeof publishedVehicles)[number] => v != null);
    if (pair.length !== 2) return null;

    const { winners } = VehicleComparisonPolicy.evaluate(
      pair.map((v) => this.toComparableVehicle(v)),
    );
    return verifyVerdict(llmReply.proposedVerdict, winners, referencedVehicleIds, buyerQualified);
  }

  private toComparableVehicle(
    vehicle: Awaited<ReturnType<VehicleRepository['findAllPublished']>>[number],
  ): ComparableVehicle {
    return {
      id: vehicle.id as number,
      category: vehicle.category,
      price: vehicle.price.amount,
      horsepowerHp: vehicle.specs.horsepowerHp,
      torqueNm: vehicle.specs.torqueNm,
      warrantyYears: vehicle.specs.warrantyYears,
      warrantyKm: vehicle.specs.warrantyKm,
      trunkCapacityL: vehicle.specs.trunkCapacityL,
      airbagsCount: vehicle.specs.airbagsCount,
      fuelEconomyNormalizedKmPerL: vehicle.fuelEconomyNormalizedKmPerL,
      hasAbs: vehicle.specs.hasAbs,
      hasStabilityControl: vehicle.specs.hasStabilityControl,
      hasRearCamera: vehicle.specs.hasRearCamera,
      hasBluetooth: vehicle.specs.hasBluetooth,
      hasCarPlay: vehicle.specs.hasCarPlay,
    };
  }

  // profile null (ADR-0012) produce un resumen vacío válido, no un error: el
  // Agente simplemente todavía no sabe nada del comprador.
  private buildProfileSummary(profile: Profile | null): ProfileSummary {
    return {
      needs: profile?.needs ?? [],
      motivations: profile?.motivations ?? [],
      objections: profile?.objections ?? [],
      budgetRange: profile?.budgetRange ? { min: profile.budgetRange.min, max: profile.budgetRange.max } : null,
    };
  }

  // Recibe los vehículos ya cargados en vez de volver a consultarlos: el
  // mismo listado alimenta al prompt y a la verificación del Veredicto.
  private toCandidateVehicles(
    vehicles: Awaited<ReturnType<VehicleRepository['findAllPublished']>>,
  ): CandidateVehicle[] {
    return vehicles.map((v) => ({
      vehicleId: v.id as number,
      brand: v.brand as unknown as string,
      model: v.model,
      trim: v.trim,
      year: v.year,
      category: v.category as unknown as string,
      priceUsd: v.price.amount,
      specs: {
        displacementCc: v.specs.displacementCc,
        cylinders: v.specs.cylinders,
        horsepowerHp: v.specs.horsepowerHp,
        torqueNm: v.specs.torqueNm,
        fuelType: v.specs.fuelType as unknown as string,
        transmissionType: v.specs.transmissionType as unknown as string,
        transmissionSpeeds: v.specs.transmissionSpeeds,
        driveType: v.specs.driveType as unknown as string,
        lengthMm: v.specs.lengthMm,
        widthMm: v.specs.widthMm,
        heightMm: v.specs.heightMm,
        wheelbaseMm: v.specs.wheelbaseMm,
        trunkCapacityL: v.specs.trunkCapacityL,
        weightKg: v.specs.weightKg,
        passengerCapacity: v.specs.passengerCapacity,
        fuelEconomyValue: v.specs.fuelEconomyValue,
        fuelEconomyUnit: v.specs.fuelEconomyUnit as unknown as string | null,
        fuelEconomyNormalizedKmPerL: v.fuelEconomyNormalizedKmPerL,
        tankCapacityL: v.specs.tankCapacityL,
        airbagsCount: v.specs.airbagsCount,
        hasAbs: v.specs.hasAbs,
        hasStabilityControl: v.specs.hasStabilityControl,
        hasRearCamera: v.specs.hasRearCamera,
        seatType: v.specs.seatType,
        hasBluetooth: v.specs.hasBluetooth,
        hasCarPlay: v.specs.hasCarPlay,
        warrantyYears: v.specs.warrantyYears,
        warrantyKm: v.specs.warrantyKm,
        highlights: v.specs.highlights,
      },
    }));
  }

  private async enforceInvariants(
    llmReply: LlmReply,
  ): Promise<{ message: string; referencedVehicleIds: number[] }> {
    if (llmReply.boundaryViolation === 'OUT_OF_SCOPE') {
      return { message: OUT_OF_SCOPE_MESSAGE, referencedVehicleIds: [] };
    }
    if (llmReply.boundaryViolation === 'COMMITS_DISCOUNT_OR_FINANCING') {
      return { message: DISCOUNT_OR_FINANCING_MESSAGE, referencedVehicleIds: [] };
    }

    const referencedVehicleIds = llmReply.referencedVehicleIds ?? [];
    if (referencedVehicleIds.length > 0) {
      const snapshot = await Promise.all(
        referencedVehicleIds.map(async (vehicleId) => {
          const vehicle = await this.vehicleRepository.findById(vehicleId);
          return vehicle ? { vehicleId, isPublished: vehicle.isPublished } : null;
        }),
      );
      const groundingResult = validateCatalogGrounding(
        referencedVehicleIds,
        snapshot.filter((entry): entry is { vehicleId: number; isPublished: boolean } => entry !== null),
      );
      if (!groundingResult.valid) {
        // los IDs que el LLM afirmó no pasaron la validación — no se
        // guardan ni se devuelven, para no contaminar el Turno ni una
        // futura "Comparación asociada" de Lead (CEB-47) con referencias
        // inválidas.
        return { message: GROUNDING_FAILURE_MESSAGE, referencedVehicleIds: [] };
      }
    }

    return { message: llmReply.message, referencedVehicleIds };
  }

  // shortcutFact: lo que el Atajo YA aplicó al principio del turno. El modelo
  // ve el mismo mensaje ("Uso familiar") y lo extrae otra vez, así que sin este
  // filtro cada tap guardaba el hecho por duplicado.
  private applyExtractedFacts(
    profile: Profile,
    llmReply: LlmReply,
    shortcutFact: ShortcutFact | null,
  ): void {
    if (llmReply.extractedNeed && shortcutFact?.kind !== 'NEED') {
      profile.captureNeed(llmReply.extractedNeed.category, llmReply.extractedNeed.detail);
    }
    if (llmReply.extractedMotivation) {
      profile.captureMotivation(llmReply.extractedMotivation.category, llmReply.extractedMotivation.detail);
    }
    if (llmReply.extractedObjection) {
      profile.captureObjection(llmReply.extractedObjection.category, llmReply.extractedObjection.detail);
    }
    if (llmReply.extractedBudget && shortcutFact?.kind !== 'BUDGET') {
      profile.captureBudget(llmReply.extractedBudget.min, llmReply.extractedBudget.max);
    }
  }

  // INV-9: el Contacto ofrecido nunca se pierde. Vive en el Perfil (ADR-0012)
  // y se materializa en Lead en cuanto la Conversación tenga al menos un
  // Vehículo — puede ser este turno o cualquiera posterior. No se relaja la
  // regla de Leads: un Lead sigue exigiendo mínimo un Vehículo.
  private async maybeCreateLead(conversation: Conversation, profile: Profile | null): Promise<void> {
    if (!profile?.contact || profile.id === null) return;
    // Ya se cerró con un Lead en este hilo.
    if (conversation.status !== ConversationStatus.ACTIVA) return;
    // El Perfil sobrevive entre Conversaciones de la misma Sesión, así que sin
    // esto una segunda Conversación volvería a crear un Lead con el contacto
    // que quedó guardado.
    if (await this.leadRepository.existsByProfileId(profile.id)) return;

    // "Comparación asociada" del Lead: todos los vehículos que el Agente
    // mencionó a lo largo de la Conversación (deduplicados) — no hay una
    // "selección" explícita como en el comparador, esto es la señal
    // equivalente en un flujo conversacional.
    const vehicleIds = [...new Set(conversation.turns.flatMap((t) => t.referencedVehicleIds))];
    if (vehicleIds.length === 0) return; // el Contacto espera en el Perfil

    const lead = this.eventPublisher.mergeObjectContext(
      Lead.create({
        firstName: profile.contact.firstName,
        lastName: profile.contact.lastName,
        phone: profile.contact.phone,
        vehicleIds,
        profileId: profile.id,
      }),
    );
    const id = await this.leadRepository.save(lead);
    lead.recordSubmission(id);
    lead.commit();

    // CEB-36-UI-01: la Conversación se completa con éxito, no se abandona.
    conversation.changeStatus(ConversationStatus.COMPLETADA);
    await this.repository.save(conversation);
  }
}
