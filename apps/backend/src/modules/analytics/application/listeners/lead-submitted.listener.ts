import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { LeadSubmittedEvent } from '../../../leads/domain/events/lead-submitted.event';
import { AnalyticsEvent } from '../../domain/analytics-event';
import { AnalyticsEventType } from '../../domain/analytics-event-type';
import {
  ANALYTICS_EVENT_REPOSITORY,
  AnalyticsEventRepository,
} from '../../domain/ports/analytics-event.repository';

// ponytail: cierra el ciclo de ADR-0004 — Leads publica, Analytics escucha.
// Sin sessionId (el evento de Leads no lo lleva, ver ADR-0008).
@EventsHandler(LeadSubmittedEvent)
export class LeadSubmittedListener implements IEventHandler<LeadSubmittedEvent> {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository,
  ) {}

  async handle(event: LeadSubmittedEvent): Promise<void> {
    const analyticsEvent = AnalyticsEvent.create({
      type: AnalyticsEventType.LEAD_SUBMITTED,
      sessionId: null,
      vehicleId: null,
      vehicleIds: event.vehicleIds,
      metadata: { leadId: event.leadId },
    });
    await this.repository.save(analyticsEvent);
  }
}
