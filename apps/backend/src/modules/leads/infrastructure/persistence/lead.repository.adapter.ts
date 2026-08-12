import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Lead } from '../../domain/lead.aggregate';
import { LeadRepository } from '../../domain/ports/lead.repository';
import { LeadMapper } from './lead.mapper';

@Injectable()
export class LeadRepositoryAdapter implements LeadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(lead: Lead): Promise<number> {
    const data = LeadMapper.toPersistence(lead);
    if (lead.id === null) {
      const created = await this.prisma.lead.create({ data });
      return created.id;
    }
    const updated = await this.prisma.lead.update({ where: { id: lead.id }, data });
    return updated.id;
  }

  async findById(id: number): Promise<Lead | null> {
    const row = await this.prisma.lead.findUnique({ where: { id } });
    return row ? LeadMapper.toDomain(row) : null;
  }
}
