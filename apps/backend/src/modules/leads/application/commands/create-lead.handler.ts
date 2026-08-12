import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { Lead } from '../../domain/lead.aggregate';
import { LEAD_REPOSITORY, LeadRepository } from '../../domain/ports/lead.repository';
import { CreateLeadCommand } from './create-lead.command';

@CommandHandler(CreateLeadCommand)
export class CreateLeadHandler implements ICommandHandler<CreateLeadCommand> {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly repository: LeadRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CreateLeadCommand): Promise<number> {
    const lead = this.eventPublisher.mergeObjectContext(Lead.create(command.props));
    const id = await this.repository.save(lead);
    // el id recién existe después de save() — recordSubmission aplica el
    // evento con el id real, nunca antes de la persistencia (Rule 3).
    lead.recordSubmission(id);
    lead.commit();
    return id;
  }
}
