import { FunnelStageReachedEvent } from '../../../agent/domain/events/funnel-stage-reached.event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { FunnelStageReachedListener } from './funnel-stage-reached.listener';

describe('FunnelStageReachedListener', () => {
  it('persists a FUNNEL_STAGE_REACHED AnalyticsEvent with the conversationId/stage from the event', async () => {
    const repository: jest.Mocked<AnalyticsEventRepository> = { save: jest.fn().mockResolvedValue(1), findAll: jest.fn() };
    const listener = new FunnelStageReachedListener(repository);

    await listener.handle(new FunnelStageReachedEvent(3, 'DESCUBRIMIENTO'));

    const saved = repository.save.mock.calls[0][0];
    expect(saved.type).toBe(AnalyticsEventType.FUNNEL_STAGE_REACHED);
    expect(saved.metadata).toEqual({ conversationId: 3, stage: 'DESCUBRIMIENTO' });
  });
});
