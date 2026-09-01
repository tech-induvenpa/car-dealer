import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ObjectionCapturedEvent } from '../../../profile/domain/events/objection-captured.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

@EventsHandler(ObjectionCapturedEvent)
export class ObjectionCapturedListener implements IEventHandler<ObjectionCapturedEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: ObjectionCapturedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.OBJECTION_CAPTURED,
      sessionId: null,
      vehicleId: null,
      vehicleIds: [],
      metadata: { profileId: event.profileId, category: event.category },
    });
    await this.repository.save(analyticsEvent);
  }
}
