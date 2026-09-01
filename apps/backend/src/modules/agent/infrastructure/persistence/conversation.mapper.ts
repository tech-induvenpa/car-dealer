import { Conversation as ConversationRow, Prisma } from '@prisma/client';
import { Conversation, Turn } from '../../domain/conversation.aggregate';
import { ConversationStatus } from '../../domain/conversation-status';

export class ConversationMapper {
  static toDomain(row: ConversationRow): Conversation {
    return Conversation.reconstruct({
      id: row.id,
      sessionId: row.sessionId,
      status: row.status as unknown as ConversationStatus,
      turns: row.turns as unknown as Turn[],
    });
  }

  static toPersistence(conversation: Conversation): Omit<Prisma.ConversationCreateInput, 'id'> {
    return {
      sessionId: conversation.sessionId,
      status: conversation.status as unknown as Prisma.ConversationCreateInput['status'],
      turns: conversation.turns as unknown as Prisma.InputJsonValue,
    };
  }
}
