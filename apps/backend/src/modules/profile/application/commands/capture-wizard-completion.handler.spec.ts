import { EventBus, EventPublisher } from '@nestjs/cqrs';
import { ProfileRepository } from '../../domain/ports/profile.repository';
import { Profile } from '../../domain/profile.aggregate';
import { CaptureWizardCompletionCommand } from './capture-wizard-completion.command';
import { CaptureWizardCompletionHandler } from './capture-wizard-completion.handler';

function noopEventPublisher(): EventPublisher {
  const eventBus = { publish: jest.fn(), publishAll: jest.fn() } as unknown as EventBus;
  return new EventPublisher(eventBus);
}

describe('CaptureWizardCompletionHandler', () => {
  it.each([
    [20000 as number | '', { min: 0, max: 20000 }],
    [35000 as number | '', { min: 0, max: 35000 }],
    ['' as number | '', { min: 35000, max: undefined }], // max solo se compara >= min más abajo
  ])('captures Necesidad(uso) and the normalized budget for tope=%s', async (presupuestoTope, expected) => {
    let savedProfile: Profile | undefined;
    const repository: jest.Mocked<ProfileRepository> = {
      findBySessionId: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockImplementation(async (profile: Profile) => {
        savedProfile = profile;
        return 1;
      }),
      findById: jest.fn(),
    };
    const handler = new CaptureWizardCompletionHandler(repository, noopEventPublisher());

    await handler.execute(new CaptureWizardCompletionCommand('session-wizard', 'SUV', presupuestoTope));

    expect(savedProfile?.needs).toEqual([{ category: 'SUV', detail: 'capturado por el Wizard' }]);
    expect(savedProfile?.budgetRange?.min).toBe(expected.min);
    if (expected.max !== undefined) {
      expect(savedProfile?.budgetRange?.max).toBe(expected.max);
    } else {
      expect(savedProfile?.budgetRange?.max ?? 0).toBeGreaterThanOrEqual(expected.min);
    }
  });

  it('reuses the existing Profile for the sessionId instead of creating a duplicate', async () => {
    const existing = Profile.reconstruct({
      id: 9,
      sessionId: 'session-existing',
      needs: [],
      motivations: [],
      objections: [],
      budgetRange: null,
    });
    const repository: jest.Mocked<ProfileRepository> = {
      findBySessionId: jest.fn().mockResolvedValue(existing),
      save: jest.fn().mockResolvedValue(9),
      findById: jest.fn(),
    };
    const handler = new CaptureWizardCompletionHandler(repository, noopEventPublisher());

    const id = await handler.execute(new CaptureWizardCompletionCommand('session-existing', 'PICKUP', 20000));

    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(id).toBe(9);
  });
});
