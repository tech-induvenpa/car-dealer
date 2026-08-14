import { CreateAnalyticsEventProps } from '../../domain/analytics-event';

export class RecordAnalyticsEventCommand {
  constructor(public readonly props: CreateAnalyticsEventProps) {}
}
