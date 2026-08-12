import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { GetDashboardHandler } from './get-dashboard.handler';

function event(overrides: Partial<{
  type: AnalyticsEventType;
  vehicleId: number | null;
  vehicleIds: number[];
  metadata: Record<string, unknown> | null;
}> = {}): AnalyticsEvent {
  return AnalyticsEvent.create({
    type: AnalyticsEventType.VEHICLE_VIEWED,
    sessionId: null,
    vehicleId: null,
    vehicleIds: [],
    metadata: null,
    ...overrides,
  });
}

describe('GetDashboardHandler', () => {
  it('counts views and comparisons per vehicle', async () => {
    const events = [
      event({ type: AnalyticsEventType.VEHICLE_VIEWED, vehicleId: 1 }),
      event({ type: AnalyticsEventType.VEHICLE_VIEWED, vehicleId: 1 }),
      event({ type: AnalyticsEventType.VEHICLE_VIEWED, vehicleId: 2 }),
      event({ type: AnalyticsEventType.COMPARISON_PERFORMED, vehicleIds: [1, 2] }),
    ];
    const repository: jest.Mocked<AnalyticsEventRepository> = {
      save: jest.fn(),
      findAll: jest.fn().mockResolvedValue(events),
    };
    const handler = new GetDashboardHandler(repository);

    const result = await handler.execute();

    expect(result.topViewed).toEqual([
      { vehicleId: 1, count: 2 },
      { vehicleId: 2, count: 1 },
    ]);
    expect(result.topCompared).toEqual([
      { vehicleId: 1, count: 1 },
      { vehicleId: 2, count: 1 },
    ]);
  });

  it('counts a pair the same regardless of id order (A-B == B-A)', async () => {
    const events = [
      event({ type: AnalyticsEventType.COMPARISON_PERFORMED, vehicleIds: [1, 2] }),
      event({ type: AnalyticsEventType.COMPARISON_PERFORMED, vehicleIds: [2, 1] }),
    ];
    const repository: jest.Mocked<AnalyticsEventRepository> = {
      save: jest.fn(),
      findAll: jest.fn().mockResolvedValue(events),
    };
    const handler = new GetDashboardHandler(repository);

    const result = await handler.execute();

    expect(result.topPairs).toEqual([{ vehicleIds: [1, 2], count: 2 }]);
  });

  it('sums leads by vehicle — one lead with 3 vehicleIds adds +1 to each', async () => {
    const events = [event({ type: AnalyticsEventType.LEAD_SUBMITTED, vehicleIds: [1, 2, 3] })];
    const repository: jest.Mocked<AnalyticsEventRepository> = {
      save: jest.fn(),
      findAll: jest.fn().mockResolvedValue(events),
    };
    const handler = new GetDashboardHandler(repository);

    const result = await handler.execute();

    expect(result.leadsByVehicle).toEqual([
      { vehicleId: 1, count: 1 },
      { vehicleId: 2, count: 1 },
      { vehicleId: 3, count: 1 },
    ]);
  });

  it('never counts the same event twice across metrics', async () => {
    // un COMPARISON_PERFORMED de 3 vehículos genera 3 pares (1-2, 1-3, 2-3),
    // cada uno contado una sola vez, no 3 veces cada uno.
    const events = [event({ type: AnalyticsEventType.COMPARISON_PERFORMED, vehicleIds: [1, 2, 3] })];
    const repository: jest.Mocked<AnalyticsEventRepository> = {
      save: jest.fn(),
      findAll: jest.fn().mockResolvedValue(events),
    };
    const handler = new GetDashboardHandler(repository);

    const result = await handler.execute();

    expect(result.topPairs).toHaveLength(3);
    expect(result.topPairs.every((p) => p.count === 1)).toBe(true);
  });
});
