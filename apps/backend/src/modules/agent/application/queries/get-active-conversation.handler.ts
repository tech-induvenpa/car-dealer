import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Conversation as ConversationRow } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { GetActiveConversationQuery } from './get-active-conversation.query';

// Bypassa el aggregate por performance, mismo criterio que el resto de las
// queries del repo (ver ddd-hexa) — devuelve la Conversación ACTIVA de la
// sesión completa (turnos incluidos), o null si no hay ninguna.
@QueryHandler(GetActiveConversationQuery)
export class GetActiveConversationHandler implements IQueryHandler<GetActiveConversationQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetActiveConversationQuery): Promise<ConversationRow | null> {
    return this.prisma.conversation.findFirst({
      where: { sessionId: query.sessionId, status: 'ACTIVA' },
    });
  }
}
