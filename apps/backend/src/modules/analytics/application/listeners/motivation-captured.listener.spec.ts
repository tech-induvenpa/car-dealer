import { MotivationCapturedEvent } from '../../../profile/domain/events/motivation-captured.event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { MotivationCapturedListener } from './motivation-captured.listener';

describe('MotivationCapturedListener', () => {
  it('persists a MOTIVATION_CAPTURED AnalyticsEvent with the profileId/category from the event', async () => {
    const repository: jest.Mocked<AnalyticsEventRepository> = { save: jest.fn().mockResolvedValue(1), findAll: jest.fn() };
    const listener = new MotivationCapturedListener(repository);

    await listener.handle(new MotivationCapturedEvent(7, 'PRIMERA_COMPRA', 'nunca tuvo carro propio'));

    const saved = repository.save.mock.calls[0][0];
    expect(saved.type).toBe(AnalyticsEventType.MOTIVATION_CAPTURED);
    expect(saved.metadata).toEqual({ profileId: 7, category: 'PRIMERA_COMPRA' });
  });
});
