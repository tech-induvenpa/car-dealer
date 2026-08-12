import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LeadNotFoundException } from '../../domain/exceptions/lead-not-found.exception';
import { LEAD_REPOSITORY, LeadRepository } from '../../domain/ports/lead.repository';
import { UpdateLeadStatusCommand } from './update-lead-status.command';

@CommandHandler(UpdateLeadStatusCommand)
export class UpdateLeadStatusHandler implements ICommandHandler<UpdateLeadStatusCommand> {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly repository: LeadRepository,
  ) {}

  async execute(command: UpdateLeadStatusCommand): Promise<void> {
    const lead = await this.repository.findById(command.id);
    if (!lead) {
      throw new LeadNotFoundException(command.id);
    }
    lead.changeStatus(command.status);
    await this.repository.save(lead);
  }
}
