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
  // exporta el puerto para que Agent (CEB-47) cree Leads directamente al
  // detectar contacto real — mismo patrón que Vehicles/Profile exportan
  // sus repositorios para Agent (CEB-42/CEB-44).
  exports: [LEAD_REPOSITORY],
})
export class LeadsModule {}
