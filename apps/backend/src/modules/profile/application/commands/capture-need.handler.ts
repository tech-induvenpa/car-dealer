import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { PROFILE_REPOSITORY, ProfileRepository } from '../../domain/ports/profile.repository';
import { CaptureNeedCommand } from './capture-need.command';
import { findOrCreateProfile } from './find-or-create-profile';

@CommandHandler(CaptureNeedCommand)
export class CaptureNeedHandler implements ICommandHandler<CaptureNeedCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CaptureNeedCommand): Promise<number> {
    const profile = await findOrCreateProfile(this.repository, command.sessionId);
    const tracked = this.eventPublisher.mergeObjectContext(profile);
    tracked.captureNeed(command.category, command.detail);
    await this.repository.save(tracked);
    tracked.commit();
    return tracked.id as number;
  }
}
