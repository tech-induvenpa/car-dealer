import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { AnalyticsEventMapper } from './analytics-event.mapper';

@Injectable()
export class AnalyticsEventRepositoryAdapter implements AnalyticsEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ponytail: solo create — los Eventos son write-only, nunca hay update
  // (ver INV-4 / ADR-0008).
  async save(event: AnalyticsEvent): Promise<number> {
    const data = AnalyticsEventMapper.toPersistence(event);
    const created = await this.prisma.analyticsEvent.create({ data });
    return created.id;
  }

  async findAll(): Promise<AnalyticsEvent[]> {
    const rows = await this.prisma.analyticsEvent.findMany();
    return rows.map(AnalyticsEventMapper.toDomain);
  }
}
