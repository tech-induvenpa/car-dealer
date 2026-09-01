import { Inject } from '@nestjs/common';
import { CommandHandler, EventPublisher, ICommandHandler } from '@nestjs/cqrs';
import { normalizeWizardBudget } from '../../domain/services/budget-normalizer';
import { PROFILE_REPOSITORY, ProfileRepository } from '../../domain/ports/profile.repository';
import { CaptureWizardCompletionCommand } from './capture-wizard-completion.command';
import { findOrCreateProfile } from './find-or-create-profile';

// ponytail: un solo comando para las dos capturas del Wizard (Necesidad +
// Presupuesto) — evita 2 round-trips desde el frontend por el mismo evento
// de "wizard completado", y mantiene la normalización server-side.
@CommandHandler(CaptureWizardCompletionCommand)
export class CaptureWizardCompletionHandler implements ICommandHandler<CaptureWizardCompletionCommand> {
  constructor(
    @Inject(PROFILE_REPOSITORY) private readonly repository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: CaptureWizardCompletionCommand): Promise<number> {
    const profile = await findOrCreateProfile(this.repository, command.sessionId);
    const tracked = this.eventPublisher.mergeObjectContext(profile);

    tracked.captureNeed(command.uso, 'capturado por el Wizard');
    const { min, max } = normalizeWizardBudget(command.presupuestoTope);
    tracked.captureBudget(min, max);

    await this.repository.save(tracked);
    tracked.commit();
    return tracked.id as number;
  }
}
