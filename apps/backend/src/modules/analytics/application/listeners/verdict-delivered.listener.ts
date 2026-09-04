import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { VerdictDeliveredEvent } from '../../../agent/domain/events/verdict-delivered.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

// Criterio de éxito del pivote. Server-side y transaccional, a diferencia de
// la mitad del evento de comparación que emite el navegador — ver la nota
// sobre los dos emisores en analytics/CONTEXT.md.
@EventsHandler(VerdictDeliveredEvent)
export class VerdictDeliveredListener implements IEventHandler<VerdictDeliveredEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: VerdictDeliveredEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.VERDICT_DELIVERED,
      sessionId: null,
      vehicleId: event.recommendedVehicleId,
      vehicleIds: event.comparedVehicleIds,
      metadata: {
        conversationId: event.conversationId,
        decisiveField: event.decisiveField,
      },
    });
    await this.repository.save(analyticsEvent);
  }
}
