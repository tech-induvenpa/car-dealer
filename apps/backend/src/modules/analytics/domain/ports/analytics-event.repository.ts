import { AnalyticsEvent } from '../analytics-event';

export const ANALYTICS_EVENT_REPOSITORY = Symbol('AnalyticsEventRepository');

export interface AnalyticsEventRepository {
  save(event: AnalyticsEvent): Promise<number>;
  findAll(): Promise<AnalyticsEvent[]>;
}
