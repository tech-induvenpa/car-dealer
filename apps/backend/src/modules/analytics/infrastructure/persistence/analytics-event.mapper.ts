import { AnalyticsEvent as AnalyticsEventRow, Prisma } from '@prisma/client';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';

export class AnalyticsEventMapper {
  static toDomain(row: AnalyticsEventRow): AnalyticsEvent {
    return AnalyticsEvent.reconstruct({
      id: row.id,
      type: row.type as unknown as AnalyticsEventType,
      sessionId: row.sessionId,
      vehicleId: row.vehicleId,
      vehicleIds: row.vehicleIds,
      metadata: row.metadata as Record<string, unknown> | null,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(event: AnalyticsEvent): Omit<Prisma.AnalyticsEventCreateInput, 'id'> {
    return {
      type: event.type as unknown as Prisma.AnalyticsEventCreateInput['type'],
      sessionId: event.sessionId,
      vehicleId: event.vehicleId,
      vehicleIds: event.vehicleIds,
      metadata: (event.metadata as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
    };
  }
}
