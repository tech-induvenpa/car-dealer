import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../../auth/auth.module';
import { RecordAnalyticsEventHandler } from '../application/commands/record-analytics-event.handler';
import { LeadSubmittedListener } from '../application/listeners/lead-submitted.listener';
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
    { provide: ANALYTICS_EVENT_REPOSITORY, useClass: AnalyticsEventRepositoryAdapter },
  ],
})
export class AnalyticsModule {}
