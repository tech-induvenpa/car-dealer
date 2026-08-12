import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../../auth/auth.module';
import { CreateLeadHandler } from '../application/commands/create-lead.handler';
import { UpdateLeadStatusHandler } from '../application/commands/update-lead-status.handler';
import { ListLeadsHandler } from '../application/queries/list-leads.handler';
import { LEAD_REPOSITORY } from '../domain/ports/lead.repository';
import { LeadsController } from './leads.controller';
import { LeadRepositoryAdapter } from './persistence/lead.repository.adapter';

@Module({
  imports: [CqrsModule, AuthModule],
  controllers: [LeadsController],
  providers: [
    CreateLeadHandler,
    UpdateLeadStatusHandler,
    ListLeadsHandler,
    { provide: LEAD_REPOSITORY, useClass: LeadRepositoryAdapter },
  ],
})
export class LeadsModule {}
