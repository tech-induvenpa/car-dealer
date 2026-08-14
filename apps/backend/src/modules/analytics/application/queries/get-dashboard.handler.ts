import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import {
  ANALYTICS_EVENT_REPOSITORY,
  AnalyticsEventRepository,
} from '../../domain/ports/analytics-event.repository';
import { GetDashboardQuery } from './get-dashboard.query';

const TOP_N = 10;

interface VehicleCount {
  vehicleId: number;
  count: number;
}

interface PairCount {
  vehicleIds: [number, number];
  count: number;
}

export interface DashboardResult {
  topViewed: VehicleCount[];
  topCompared: VehicleCount[];
  topPairs: PairCount[];
  leadsByVehicle: VehicleCount[];
}

// ponytail: agregaciones en memoria sobre todos los AnalyticsEvent — se
// calcula al leer, no hay tabla mantenida aparte (ver CONTEXT.md).
@QueryHandler(GetDashboardQuery)
export class GetDashboardHandler implements IQueryHandler<GetDashboardQuery> {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository,
  ) {}

  async execute(): Promise<DashboardResult> {
    const events = await this.repository.findAll();

    return {
      topViewed: this.byVehicleId(events, AnalyticsEventType.VEHICLE_VIEWED),
      topCompared: this.byVehicleIdsMembership(events, AnalyticsEventType.COMPARISON_PERFORMED),
      topPairs: this.byPair(events),
      leadsByVehicle: this.byVehicleIdsMembership(events, AnalyticsEventType.LEAD_SUBMITTED),
    };
  }

  private byVehicleId(events: AnalyticsEvent[], type: AnalyticsEventType): VehicleCount[] {
    const counts = new Map<number, number>();
    for (const event of events) {
      if (event.type !== type || event.vehicleId == null) continue;
      counts.set(event.vehicleId, (counts.get(event.vehicleId) ?? 0) + 1);
    }
    return this.sortTop(counts);
  }

  private byVehicleIdsMembership(
    events: AnalyticsEvent[],
    type: AnalyticsEventType,
  ): VehicleCount[] {
    const counts = new Map<number, number>();
    for (const event of events) {
      if (event.type !== type) continue;
      for (const vehicleId of event.vehicleIds) {
        counts.set(vehicleId, (counts.get(vehicleId) ?? 0) + 1);
      }
    }
    return this.sortTop(counts);
  }

  // pares normalizados (A-B y B-A cuentan como el mismo par).
  private byPair(events: AnalyticsEvent[]): PairCount[] {
    const counts = new Map<string, PairCount>();
    for (const event of events) {
      if (event.type !== AnalyticsEventType.COMPARISON_PERFORMED) continue;
      const ids = [...event.vehicleIds].sort((a, b) => a - b);
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = `${ids[i]}-${ids[j]}`;
          const existing = counts.get(key);
          if (existing) {
            existing.count++;
          } else {
            counts.set(key, { vehicleIds: [ids[i], ids[j]], count: 1 });
          }
        }
      }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, TOP_N);
  }

  private sortTop(counts: Map<number, number>): VehicleCount[] {
    return [...counts.entries()]
      .map(([vehicleId, count]) => ({ vehicleId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_N);
  }
}
