import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { FunnelStageReachedEvent } from '../../../agent/domain/events/funnel-stage-reached.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

// Alimenta el proyecto de estandarización de piso de ventas (ver memoria de
// proyecto) — el log de Etapas no es solo para este feature.
@EventsHandler(FunnelStageReachedEvent)
export class FunnelStageReachedListener implements IEventHandler<FunnelStageReachedEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: FunnelStageReachedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.FUNNEL_STAGE_REACHED,
      sessionId: null,
      vehicleId: null,
      vehicleIds: [],
      metadata: { conversationId: event.conversationId, stage: event.stage },
    });
    await this.repository.save(analyticsEvent);
  }
}
