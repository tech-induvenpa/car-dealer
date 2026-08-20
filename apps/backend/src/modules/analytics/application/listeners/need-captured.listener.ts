import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { NeedCapturedEvent } from '../../../profile/domain/events/need-captured.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

// ponytail: cierra el ciclo de ADR-0004 para Profile — mismo patrón que
// LeadSubmittedListener. Profile no sabe que Analytics existe.
@EventsHandler(NeedCapturedEvent)
export class NeedCapturedListener implements IEventHandler<NeedCapturedEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: NeedCapturedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.NEED_CAPTURED,
      sessionId: null,
      vehicleId: null,
      vehicleIds: [],
      metadata: { profileId: event.profileId, category: event.category },
    });
    await this.repository.save(analyticsEvent);
  }
}
