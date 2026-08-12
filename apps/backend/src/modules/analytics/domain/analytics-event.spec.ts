import { AnalyticsEvent, CreateAnalyticsEventProps } from './analytics-event';
import { AnalyticsEventType } from './analytics-event-type';
import { InconsistentAnalyticsEventException } from './exceptions/inconsistent-analytics-event.exception';

function baseProps(overrides: Partial<CreateAnalyticsEventProps> = {}): CreateAnalyticsEventProps {
  return {
    type: AnalyticsEventType.VEHICLE_VIEWED,
    sessionId: 'session-1',
    vehicleId: null,
    vehicleIds: [],
    metadata: null,
    ...overrides,
  };
}

describe('AnalyticsEvent', () => {
  it('creates a VEHICLE_VIEWED event with a vehicleId', () => {
    const event = AnalyticsEvent.create(baseProps({ vehicleId: 1 }));
    expect(event.type).toBe(AnalyticsEventType.VEHICLE_VIEWED);
    expect(event.id).toBeNull();
  });

  it('rejects VEHICLE_VIEWED without a vehicleId', () => {
    expect(() => AnalyticsEvent.create(baseProps({ vehicleId: null }))).toThrow(
      InconsistentAnalyticsEventException,
    );
  });

  it('creates a VEHICLE_ADDED_TO_COMPARISON event with a vehicleId', () => {
    const event = AnalyticsEvent.create(
      baseProps({ type: AnalyticsEventType.VEHICLE_ADDED_TO_COMPARISON, vehicleId: 1 }),
    );
    expect(event.vehicleId).toBe(1);
  });

  it('rejects VEHICLE_ADDED_TO_COMPARISON without a vehicleId', () => {
    expect(() =>
      AnalyticsEvent.create(
        baseProps({ type: AnalyticsEventType.VEHICLE_ADDED_TO_COMPARISON, vehicleId: null }),
      ),
    ).toThrow(InconsistentAnalyticsEventException);
  });

  it('creates a COMPARISON_PERFORMED event with 2-4 vehicleIds', () => {
    const event = AnalyticsEvent.create(
      baseProps({ type: AnalyticsEventType.COMPARISON_PERFORMED, vehicleIds: [1, 2, 3] }),
    );
    expect(event.vehicleIds).toEqual([1, 2, 3]);
  });

  it('rejects COMPARISON_PERFORMED with fewer than 2 vehicleIds', () => {
    expect(() =>
      AnalyticsEvent.create(
        baseProps({ type: AnalyticsEventType.COMPARISON_PERFORMED, vehicleIds: [1] }),
      ),
    ).toThrow(InconsistentAnalyticsEventException);
  });

  it('rejects COMPARISON_PERFORMED with more than 4 vehicleIds', () => {
    expect(() =>
      AnalyticsEvent.create(
        baseProps({
          type: AnalyticsEventType.COMPARISON_PERFORMED,
          vehicleIds: [1, 2, 3, 4, 5],
        }),
      ),
    ).toThrow(InconsistentAnalyticsEventException);
  });

  it('creates a QUIZ_COMPLETED event with metadata', () => {
    const event = AnalyticsEvent.create(
      baseProps({ type: AnalyticsEventType.QUIZ_COMPLETED, metadata: { uso: 'familiar' } }),
    );
    expect(event.metadata).toEqual({ uso: 'familiar' });
  });

  it('rejects QUIZ_COMPLETED without metadata', () => {
    expect(() =>
      AnalyticsEvent.create(baseProps({ type: AnalyticsEventType.QUIZ_COMPLETED, metadata: null })),
    ).toThrow(InconsistentAnalyticsEventException);
  });

  it('creates a LEAD_SUBMITTED event with vehicleIds', () => {
    const event = AnalyticsEvent.create(
      baseProps({ type: AnalyticsEventType.LEAD_SUBMITTED, vehicleIds: [1, 2] }),
    );
    expect(event.vehicleIds).toEqual([1, 2]);
  });

  it('rejects LEAD_SUBMITTED with empty vehicleIds', () => {
    expect(() =>
      AnalyticsEvent.create(
        baseProps({ type: AnalyticsEventType.LEAD_SUBMITTED, vehicleIds: [] }),
      ),
    ).toThrow(InconsistentAnalyticsEventException);
  });
});
