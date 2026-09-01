import { Conversation } from '../conversation.aggregate';

export const CONVERSATION_REPOSITORY = Symbol('ConversationRepository');

export interface ConversationRepository {
  save(conversation: Conversation): Promise<number>;
  findById(id: number): Promise<Conversation | null>;
  // CEB-36-UI-01: una sesión puede tener varias Conversaciones — esto
  // resuelve a lo sumo una (la ACTIVA), nunca "la" Conversación de la sesión.
  findActiveBySessionId(sessionId: string): Promise<Conversation | null>;
}
