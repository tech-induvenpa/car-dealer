import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { BudgetCapturedEvent } from '../../../profile/domain/events/budget-captured.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

@EventsHandler(BudgetCapturedEvent)
export class BudgetCapturedListener implements IEventHandler<BudgetCapturedEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: BudgetCapturedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.BUDGET_CAPTURED,
      sessionId: null,
      vehicleId: null,
      vehicleIds: [],
      metadata: { profileId: event.profileId, min: event.min, max: event.max },
    });
    await this.repository.save(analyticsEvent);
  }
}
