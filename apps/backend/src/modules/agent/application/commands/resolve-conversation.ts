import { Conversation } from '../../domain/conversation.aggregate';
import { ConversationStatus } from '../../domain/conversation-status';
import { ConversationNotFoundException } from '../../domain/exceptions/conversation-not-found.exception';
import { ConversationRepository } from '../../domain/ports/conversation.repository';

// CEB-36-UI-01: una sesión puede tener varias Conversaciones a lo largo del
// tiempo, pero nunca más de una ACTIVA a la vez. Pasar `conversationId`
// continúa esa Conversación puntual; omitirlo siempre abandona la ACTIVA
// existente (si hay una) y arranca una nueva — nunca "encuentra" una vieja
// en silencio, a diferencia del comportamiento anterior a esta slice.
export async function resolveConversation(
  repository: ConversationRepository,
  sessionId: string,
  conversationId: number | undefined,
): Promise<Conversation> {
  if (conversationId != null) {
    const existing = await repository.findById(conversationId);
    if (!existing || existing.sessionId !== sessionId || existing.status !== ConversationStatus.ACTIVA) {
      throw new ConversationNotFoundException();
    }
    return existing;
  }

  const active = await repository.findActiveBySessionId(sessionId);
  if (active) {
    active.changeStatus(ConversationStatus.ABANDONADA);
    await repository.save(active);
  }

  const id = await repository.save(Conversation.create({ sessionId }));
  return Conversation.reconstruct({ id, sessionId, status: ConversationStatus.ACTIVA, turns: [] });
}
