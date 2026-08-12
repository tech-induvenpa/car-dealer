import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Lead as LeadRow } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/infrastructure/jwt-auth.guard';
import { CreateLeadCommand } from '../application/commands/create-lead.command';
import { UpdateLeadStatusCommand } from '../application/commands/update-lead-status.command';
import { ListLeadsQuery } from '../application/queries/list-leads.query';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  async create(@Body() dto: CreateLeadDto): Promise<{ id: number }> {
    const id = await this.commandBus.execute<CreateLeadCommand, number>(
      new CreateLeadCommand({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        vehicleIds: dto.vehicleIds,
      }),
    );
    return { id };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async list(): Promise<LeadRow[]> {
    return this.queryBus.execute(new ListLeadsQuery());
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadStatusDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdateLeadStatusCommand, void>(
      new UpdateLeadStatusCommand(id, dto.status),
    );
  }
}
