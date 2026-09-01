import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MotivationCapturedEvent } from '../../../profile/domain/events/motivation-captured.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

@EventsHandler(MotivationCapturedEvent)
export class MotivationCapturedListener implements IEventHandler<MotivationCapturedEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: MotivationCapturedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.MOTIVATION_CAPTURED,
      sessionId: null,
      vehicleId: null,
      vehicleIds: [],
      metadata: { profileId: event.profileId, category: event.category },
    });
    await this.repository.save(analyticsEvent);
  }
}
