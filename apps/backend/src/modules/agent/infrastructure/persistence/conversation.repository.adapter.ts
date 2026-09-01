import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Conversation } from '../../domain/conversation.aggregate';
import { ConversationRepository } from '../../domain/ports/conversation.repository';
import { ConversationMapper } from './conversation.mapper';

@Injectable()
export class ConversationRepositoryAdapter implements ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(conversation: Conversation): Promise<number> {
    const data = ConversationMapper.toPersistence(conversation);
    if (conversation.id === null) {
      const created = await this.prisma.conversation.create({ data });
      return created.id;
    }
    const updated = await this.prisma.conversation.update({ where: { id: conversation.id }, data });
    return updated.id;
  }

  async findById(id: number): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({ where: { id } });
    return row ? ConversationMapper.toDomain(row) : null;
  }

  async findActiveBySessionId(sessionId: string): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findFirst({ where: { sessionId, status: 'ACTIVA' } });
    return row ? ConversationMapper.toDomain(row) : null;
  }
}
