import { BudgetCapturedEvent } from '../../../profile/domain/events/budget-captured.event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';
import { BudgetCapturedListener } from './budget-captured.listener';

describe('BudgetCapturedListener', () => {
  it('persists a BUDGET_CAPTURED AnalyticsEvent with the profileId/min/max from the event', async () => {
    const repository: jest.Mocked<AnalyticsEventRepository> = { save: jest.fn().mockResolvedValue(1), findAll: jest.fn() };
    const listener = new BudgetCapturedListener(repository);

    await listener.handle(new BudgetCapturedEvent(7, 0, 20000));

    const saved = repository.save.mock.calls[0][0];
    expect(saved.type).toBe(AnalyticsEventType.BUDGET_CAPTURED);
    expect(saved.metadata).toEqual({ profileId: 7, min: 0, max: 20000 });
  });
});
