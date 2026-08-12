import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Lead as LeadRow } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ListLeadsQuery } from './list-leads.query';

// ponytail: sin enriquecer con datos de Vehicle (YAGNI — no hay UI admin
// todavía que lo necesite, ver PRD). DTO plano directo de Prisma.
@QueryHandler(ListLeadsQuery)
export class ListLeadsHandler implements IQueryHandler<ListLeadsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(): Promise<LeadRow[]> {
    return this.prisma.lead.findMany({ orderBy: { id: 'asc' } });
  }
}
