import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { RecordAnalyticsEventCommand } from '../application/commands/record-analytics-event.command';
import { DashboardResult } from '../application/queries/get-dashboard.handler';
import { GetDashboardQuery } from '../application/queries/get-dashboard.query';
import { RecordAnalyticsEventDto } from './dto/record-analytics-event.dto';

@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('events')
  @UseGuards(ThrottlerGuard)
  // más generoso que Leads (5/60s) — un visitante genuino genera bastantes
  // más eventos por sesión, ver sesión de diseño.
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async recordEvent(@Body() dto: RecordAnalyticsEventDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<RecordAnalyticsEventCommand, number>(
      new RecordAnalyticsEventCommand({
        type: dto.type,
        sessionId: dto.sessionId ?? null,
        vehicleId: dto.vehicleId ?? null,
        vehicleIds: dto.vehicleIds ?? [],
        metadata: dto.metadata ?? null,
      }),
    );
    return { id };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async dashboard(): Promise<DashboardResult> {
    return this.queryBus.execute(new GetDashboardQuery());
  }
}
