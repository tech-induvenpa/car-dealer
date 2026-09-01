import { NeedCapturedEvent } from '../../../profile/domain/events/need-captured.event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { NeedCapturedListener } from './need-captured.listener';

describe('NeedCapturedListener', () => {
  it('persists a NEED_CAPTURED AnalyticsEvent with the profileId/category from the event, no sessionId', async () => {
    const repository: jest.Mocked<AnalyticsEventRepository> = { save: jest.fn().mockResolvedValue(1), findAll: jest.fn() };
    const listener = new NeedCapturedListener(repository);

    await listener.handle(new NeedCapturedEvent(7, 'SUV', 'familia numerosa'));

    const saved = repository.save.mock.calls[0][0];
    expect(saved.type).toBe(AnalyticsEventType.NEED_CAPTURED);
    expect(saved.sessionId).toBeNull();
    expect(saved.metadata).toEqual({ profileId: 7, category: 'SUV' });
  });
});
