import { ObjectionCapturedEvent } from '../../../profile/domain/events/objection-captured.event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { ObjectionCapturedListener } from './objection-captured.listener';

describe('ObjectionCapturedListener', () => {
  it('persists an OBJECTION_CAPTURED AnalyticsEvent with the profileId/category from the event', async () => {
    const repository: jest.Mocked<AnalyticsEventRepository> = { save: jest.fn().mockResolvedValue(1), findAll: jest.fn() };
    const listener = new ObjectionCapturedListener(repository);

    await listener.handle(new ObjectionCapturedEvent(7, 'PRECIO', 'le parece caro'));

    const saved = repository.save.mock.calls[0][0];
    expect(saved.type).toBe(AnalyticsEventType.OBJECTION_CAPTURED);
    expect(saved.metadata).toEqual({ profileId: 7, category: 'PRECIO' });
  });
});
