import { LeadSubmittedEvent } from '../../../leads/domain/events/lead-submitted.event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { LeadSubmittedListener } from './lead-submitted.listener';

describe('LeadSubmittedListener', () => {
  it('persists a LEAD_SUBMITTED AnalyticsEvent with the leadId/vehicleIds from the event, no sessionId', async () => {
    const repository: jest.Mocked<AnalyticsEventRepository> = {
      save: jest.fn().mockResolvedValue(1),
      findAll: jest.fn(),
    };
    const listener = new LeadSubmittedListener(repository);

    await listener.handle(new LeadSubmittedEvent(42, [1, 2]));

    expect(repository.save).toHaveBeenCalledTimes(1);
    const saved = repository.save.mock.calls[0][0];
    expect(saved.type).toBe(AnalyticsEventType.LEAD_SUBMITTED);
    expect(saved.vehicleIds).toEqual([1, 2]);
    expect(saved.sessionId).toBeNull();
    expect(saved.metadata).toEqual({ leadId: 42 });
  });
});
