import { Conversation } from '../conversation.aggregate';

export const CONVERSATION_REPOSITORY = Symbol('ConversationRepository');

export interface ConversationRepository {
  save(conversation: Conversation): Promise<number>;
  findById(id: number): Promise<Conversation | null>;
  findBySessionId(sessionId: string): Promise<Conversation | null>;
}
