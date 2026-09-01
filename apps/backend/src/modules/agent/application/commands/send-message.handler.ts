import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { PROFILE_REPOSITORY, ProfileRepository } from '../../../profile/domain/ports/profile.repository';
import { findOrCreateProfile } from '../../../profile/application/commands/find-or-create-profile';
import { Profile } from '../../../profile/domain/profile.aggregate';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../../vehicles/domain/ports/vehicle.repository';
import { LEAD_REPOSITORY, LeadRepository } from '../../../leads/domain/ports/lead.repository';
import { Lead } from '../../../leads/domain/lead.aggregate';
import { validateCatalogGrounding } from '../../domain/services/catalog-grounding-guard';
import { inferFunnelStage } from '../../domain/services/funnel-stage';
import { assertCanRequestContact } from '../../domain/services/contact-gate';
import { FunnelStageReachedEvent } from '../../domain/events/funnel-stage-reached.event';
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
  'Los descuentos y condiciones de financiamiento los define nuestro equipo comercial, no yo — puedo seguir ayudándote a encontrar el vehículo que mejor se ajuste a lo que buscás.';
const GROUNDING_FAILURE_MESSAGE =
  'Disculpa, no tengo esa información exacta en el catálogo ahora mismo — ¿querés que te muestre las opciones disponibles?';

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

    // Perfil se busca ANTES de llamar al LLM (no solo después, como antes)
    // — la Etapa y el resumen del Perfil de ESTE momento son justo lo que
    // el Agente necesita para saber qué preguntar (pedido explícito: que
    // pregunte acorde a lo que ya sabe, no que repita).
    const profile = await findOrCreateProfile(this.profileRepository, command.sessionId);
    const trackedProfile = this.eventPublisher.mergeObjectContext(profile);
    const stageBeforeThisTurn = inferFunnelStage(tracked, trackedProfile);

    const candidateVehicles = await this.loadCandidateVehicles();
    const llmReply = await this.llm.reply({
      turns: tracked.turns,
      buyerMessage: command.message,
      candidateVehicles,
      currentStage: stageBeforeThisTurn,
      profileSummary: this.buildProfileSummary(trackedProfile),
    });

    const { message: finalMessage, referencedVehicleIds } = await this.enforceInvariants(llmReply);

    tracked.recordTurn(command.message, finalMessage, llmReply.intentSignal ?? null, referencedVehicleIds);
    await this.repository.save(tracked);
    tracked.commit();

    // CEB-44: el Perfil se nutre independientemente de si la Conversación
    // llega a buen puerto — incluso si se abandona después, lo ya
    // capturado queda persistido (INV-3).
    this.applyExtractedFacts(trackedProfile, llmReply);
    await this.profileRepository.save(trackedProfile);
    trackedProfile.commit();

    // CEB-47: solo si el comprador ya dejó contacto Y el gate de INV-4 lo
    // permite (Perfil calificado) — si no califica, no se crea el Lead
    // pero el turno sigue normal (no se le muestra un error al comprador).
    await this.maybeCreateLead(tracked, trackedProfile, llmReply);

    // El evento se publica desde acá (no desde Conversation.apply()) porque
    // inferFunnelStage necesita a Profile, de otro contexto — ver
    // agent/domain/events/funnel-stage-reached.event.ts. Se recalcula
    // DESPUÉS del turno (a diferencia de stageBeforeThisTurn) porque es
    // para el log de Analytics, no para el prompt.
    const stageAfterThisTurn = inferFunnelStage(tracked, trackedProfile);
    this.eventBus.publish(new FunnelStageReachedEvent(tracked.id as number, stageAfterThisTurn));

    return { conversationId: tracked.id as number, reply: finalMessage, referencedVehicleIds };
  }

  private buildProfileSummary(profile: Profile): ProfileSummary {
    return {
      needs: profile.needs,
      motivations: profile.motivations,
      objections: profile.objections,
      budgetRange: profile.budgetRange ? { min: profile.budgetRange.min, max: profile.budgetRange.max } : null,
    };
  }

  private async loadCandidateVehicles(): Promise<CandidateVehicle[]> {
    const vehicles = await this.vehicleRepository.findAllPublished();
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

  private applyExtractedFacts(profile: Profile, llmReply: LlmReply): void {
    if (llmReply.extractedNeed) {
      profile.captureNeed(llmReply.extractedNeed.category, llmReply.extractedNeed.detail);
    }
    if (llmReply.extractedMotivation) {
      profile.captureMotivation(llmReply.extractedMotivation.category, llmReply.extractedMotivation.detail);
    }
    if (llmReply.extractedObjection) {
      profile.captureObjection(llmReply.extractedObjection.category, llmReply.extractedObjection.detail);
    }
    if (llmReply.extractedBudget) {
      profile.captureBudget(llmReply.extractedBudget.min, llmReply.extractedBudget.max);
    }
  }

  private async maybeCreateLead(
    conversation: Conversation,
    profile: Profile,
    llmReply: LlmReply,
  ): Promise<void> {
    if (!llmReply.extractedContact) return;

    try {
      assertCanRequestContact(profile);
    } catch {
      return; // INV-4: sin Señal de intención, el Lead no se crea todavía.
    }

    // "Comparación asociada" del Lead: todos los vehículos que el Agente
    // mencionó a lo largo de la Conversación (deduplicados) — no hay una
    // "selección" explícita como en el comparador, esto es la señal
    // equivalente en un flujo conversacional.
    const vehicleIds = [...new Set(conversation.turns.flatMap((t) => t.referencedVehicleIds))];
    if (vehicleIds.length === 0) return;

    const lead = this.eventPublisher.mergeObjectContext(
      Lead.create({
        firstName: llmReply.extractedContact.firstName,
        lastName: llmReply.extractedContact.lastName,
        phone: llmReply.extractedContact.phone,
        vehicleIds,
        profileId: profile.id,
      }),
    );
    const id = await this.leadRepository.save(lead);
    lead.recordSubmission(id);
    lead.commit();

    // CEB-36-UI-01: la Conversación se completa con éxito, no se abandona —
    // primera transición real de Estado que existe en el código hasta ahora.
    conversation.changeStatus(ConversationStatus.COMPLETADA);
    await this.repository.save(conversation);
  }
}
