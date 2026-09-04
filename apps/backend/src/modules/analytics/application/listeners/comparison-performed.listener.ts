import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ComparisonPerformedEvent } from '../../../agent/domain/events/comparison-performed.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import { ANALYTICS_EVENT_REPOSITORY, AnalyticsEventRepository } from '../../domain/ports/analytics-event.repository';

// La mitad confiable de "Comparaciones realizadas": el Agente publica un
// evento de dominio desde el handler de un Command, así que se persiste en el
// mismo flujo que el turno. La otra mitad la emite el navegador con
// trackEvent, que es fire-and-forget — no son igual de confiables, ver
// analytics/CONTEXT.md antes de leer la métrica agregada.
@EventsHandler(ComparisonPerformedEvent)
export class ComparisonPerformedListener implements IEventHandler<ComparisonPerformedEvent> {
  constructor(@Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository) {}

  async handle(event: ComparisonPerformedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.COMPARISON_PERFORMED,
      sessionId: event.sessionId,
      vehicleId: null,
      vehicleIds: event.vehicleIds,
      metadata: null,
    });
    await this.repository.save(analyticsEvent);
  }
}
