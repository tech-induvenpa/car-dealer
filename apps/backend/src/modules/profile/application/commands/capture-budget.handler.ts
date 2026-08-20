import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { PROFILE_REPOSITORY, ProfileRepository } from '../../domain/ports/profile.repository';
import { CaptureBudgetCommand } from './capture-budget.command';
import { findOrCreateProfile } from './find-or-create-profile';

@CommandHandler(CaptureBudgetCommand)
export class CaptureBudgetHandler implements ICommandHandler<CaptureBudgetCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CaptureBudgetCommand): Promise<number> {
    const profile = await findOrCreateProfile(this.repository, command.sessionId);
    const tracked = this.eventPublisher.mergeObjectContext(profile);
    tracked.captureBudget(command.min, command.max);
    await this.repository.save(tracked);
    tracked.commit();
    return tracked.id as number;
  }
}
