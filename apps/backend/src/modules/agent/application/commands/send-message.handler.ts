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
import { CandidateVehicle, LLM_PORT, LlmPort, LlmReply } from '../../domain/ports/llm.port';
import { findOrCreateConversation } from './find-or-create-conversation';
import { SendMessageCommand } from './send-message.command';

export interface SendMessageResult {
  conversationId: number;
  reply: string;
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
    const conversation = await findOrCreateConversation(this.repository, command.sessionId);
    const tracked = this.eventPublisher.mergeObjectContext(conversation);

    const candidateVehicles = await this.loadCandidateVehicles();
    const llmReply = await this.llm.reply({
      turns: tracked.turns,
      buyerMessage: command.message,
      candidateVehicles,
    });

    const finalMessage = await this.enforceInvariants(llmReply);

    tracked.recordTurn(
      command.message,
      finalMessage,
      llmReply.intentSignal ?? null,
      llmReply.referencedVehicleIds ?? [],
    );
    await this.repository.save(tracked);
    tracked.commit();

    // CEB-44: el Perfil se nutre independientemente de si la Conversación
    // llega a buen puerto — incluso si se abandona después, lo ya
    // capturado queda persistido (INV-3).
    const profile = await this.captureProfileFacts(command.sessionId, llmReply);

    // CEB-47: solo si el comprador ya dejó contacto Y el gate de INV-4 lo
    // permite (Perfil calificado) — si no califica, no se crea el Lead
    // pero el turno sigue normal (no se le muestra un error al comprador).
    await this.maybeCreateLead(tracked, profile, llmReply);

    // El evento se publica desde acá (no desde Conversation.apply()) porque
    // inferFunnelStage necesita a Profile, de otro contexto — ver
    // agent/domain/events/funnel-stage-reached.event.ts.
    const stage = inferFunnelStage(tracked, profile);
    this.eventBus.publish(new FunnelStageReachedEvent(tracked.id as number, stage));

    return { conversationId: tracked.id as number, reply: finalMessage };
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
    }));
  }

  private async enforceInvariants(llmReply: LlmReply): Promise<string> {
    if (llmReply.boundaryViolation === 'OUT_OF_SCOPE') {
      return OUT_OF_SCOPE_MESSAGE;
    }
    if (llmReply.boundaryViolation === 'COMMITS_DISCOUNT_OR_FINANCING') {
      return DISCOUNT_OR_FINANCING_MESSAGE;
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
        return GROUNDING_FAILURE_MESSAGE;
      }
    }

    return llmReply.message;
  }

  private async captureProfileFacts(sessionId: string, llmReply: LlmReply): Promise<Profile> {
    const profile = await findOrCreateProfile(this.profileRepository, sessionId);
    const trackedProfile = this.eventPublisher.mergeObjectContext(profile);

    if (llmReply.extractedNeed) {
      trackedProfile.captureNeed(llmReply.extractedNeed.category, llmReply.extractedNeed.detail);
    }
    if (llmReply.extractedMotivation) {
      trackedProfile.captureMotivation(llmReply.extractedMotivation.category, llmReply.extractedMotivation.detail);
    }
    if (llmReply.extractedObjection) {
      trackedProfile.captureObjection(llmReply.extractedObjection.category, llmReply.extractedObjection.detail);
    }
    if (llmReply.extractedBudget) {
      trackedProfile.captureBudget(llmReply.extractedBudget.min, llmReply.extractedBudget.max);
    }

    await this.profileRepository.save(trackedProfile);
    trackedProfile.commit();
    return trackedProfile;
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
  }
}
