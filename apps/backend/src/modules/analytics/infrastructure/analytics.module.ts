import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../../auth/auth.module';
import { RecordAnalyticsEventHandler } from '../application/commands/record-analytics-event.handler';
import { LeadSubmittedListener } from '../application/listeners/lead-submitted.listener';
import { NeedCapturedListener } from '../application/listeners/need-captured.listener';
import { MotivationCapturedListener } from '../application/listeners/motivation-captured.listener';
import { ObjectionCapturedListener } from '../application/listeners/objection-captured.listener';
import { BudgetCapturedListener } from '../application/listeners/budget-captured.listener';
import { FunnelStageReachedListener } from '../application/listeners/funnel-stage-reached.listener';
import { GetDashboardHandler } from '../application/queries/get-dashboard.handler';
import { ANALYTICS_EVENT_REPOSITORY } from '../domain/ports/analytics-event.repository';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEventRepositoryAdapter } from './persistence/analytics-event.repository.adapter';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [AnalyticsController],
  providers: [
    RecordAnalyticsEventHandler,
    GetDashboardHandler,
    LeadSubmittedListener,
    NeedCapturedListener,
    MotivationCapturedListener,
    ObjectionCapturedListener,
    BudgetCapturedListener,
    FunnelStageReachedListener,
    { provide: ANALYTICS_EVENT_REPOSITORY, useClass: AnalyticsEventRepositoryAdapter },
  ],
})
export class AnalyticsModule {}
