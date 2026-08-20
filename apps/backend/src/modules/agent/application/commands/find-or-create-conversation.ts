import { Conversation } from '../../domain/conversation.aggregate';
import { ConversationRepository } from '../../domain/ports/conversation.repository';
import { ConversationStatus } from '../../domain/conversation-status';

// ponytail: mismo criterio que findOrCreateProfile en profile/ — cada
// sesión tiene a lo sumo una Conversación en curso.
export async function findOrCreateConversation(
  repository: ConversationRepository,
  sessionId: string,
): Promise<Conversation> {
  const existing = await repository.findBySessionId(sessionId);
  if (existing) {
    return existing;
  }
  const id = await repository.save(Conversation.create({ sessionId }));
  return Conversation.reconstruct({ id, sessionId, status: ConversationStatus.ACTIVA, turns: [] });
}
