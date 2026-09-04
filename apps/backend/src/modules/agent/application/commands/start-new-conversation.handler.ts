import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { PROFILE_REPOSITORY, ProfileRepository } from '../../../profile/domain/ports/profile.repository';
import { findProfile } from '../../../profile/application/commands/find-or-create-profile';
import { ConversationStatus } from '../../domain/conversation-status';
import { CONVERSATION_REPOSITORY, ConversationRepository } from '../../domain/ports/conversation.repository';
import { StartNewConversationCommand } from './start-new-conversation.command';

// Abandona la Conversación ACTIVA (si hay) y hace que el Agente olvide lo
// declarado. El Perfil NO se borra: conserva su Contacto, y los Eventos de
// Analytics ya emitidos son inmutables, así que no se pierde nada analítico ni
// ningún Lead ya creado.
@CommandHandler(StartNewConversationCommand)
export class StartNewConversationHandler implements ICommandHandler<StartNewConversationCommand> {
  constructor(
    @Inject(CONVERSATION_REPOSITORY) private readonly conversations: ConversationRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profiles: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: StartNewConversationCommand): Promise<void> {
    const active = await this.conversations.findActiveBySessionId(command.sessionId);
    if (active) {
      active.changeStatus(ConversationStatus.ABANDONADA);
      await this.conversations.save(active);
    }

    // Sin Perfil no hay nada que olvidar — con creación perezosa (ADR-0012) es
    // el caso normal de alguien que conversó sin declarar nada.
    const profile = await findProfile(this.profiles, command.sessionId);
    if (!profile) return;

    const tracked = this.eventPublisher.mergeObjectContext(profile);
    tracked.forgetDeclaredFacts();
    await this.profiles.save(tracked);
    tracked.commit();
  }
}
