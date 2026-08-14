import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { AnalyticsEvent } from '../../domain/analytics-event';
import {
  ANALYTICS_EVENT_REPOSITORY,
  AnalyticsEventRepository,
} from '../../domain/ports/analytics-event.repository';
import { RecordAnalyticsEventCommand } from './record-analytics-event.command';

@CommandHandler(RecordAnalyticsEventCommand)
export class RecordAnalyticsEventHandler implements ICommandHandler<RecordAnalyticsEventCommand> {
  constructor(
    @Inject(ANALYTICS_EVENT_REPOSITORY) private readonly repository: AnalyticsEventRepository,
  ) {}

  async execute(command: RecordAnalyticsEventCommand): Promise<number> {
    const event = AnalyticsEvent.create(command.props);
    return this.repository.save(event);
  }
}
