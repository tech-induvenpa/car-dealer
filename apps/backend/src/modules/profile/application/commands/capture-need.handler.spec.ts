import { EventBus, EventPublisher } from '@nestjs/cqrs';
import { Profile } from '../../domain/profile.aggregate';
import { NeedCapturedEvent } from '../../domain/events/need-captured.event';
import { ProfileRepository } from '../../domain/ports/profile.repository';
import { CaptureNeedCommand } from './capture-need.command';
import { CaptureNeedHandler } from './capture-need.handler';

describe('CaptureNeedHandler', () => {
  function eventPublisher(): { publisher: EventPublisher; publishedEvents: () => NeedCapturedEvent[] } {
    let published: NeedCapturedEvent[] = [];
    const publishAll = jest.fn().mockImplementation((events: NeedCapturedEvent[]) => {
      published = [...events];
    });
    const eventBus = { publish: jest.fn(), publishAll } as unknown as EventBus;
    return { publisher: new EventPublisher(eventBus), publishedEvents: () => published };
  }

  it('creates a Profile for a session with no prior Profile, then captures the Need', async () => {
    const calls: string[] = [];
    const repository: jest.Mocked<ProfileRepository> = {
      findBySessionId: jest.fn().mockImplementation(async () => {
        calls.push('findBySessionId');
        return null;
      }),
      // create-save asigna id 1; el capture-save siguiente actualiza esa
      // misma fila, no genera un id nuevo — de ahí que siempre devuelva 1.
      save: jest.fn().mockImplementation(async () => {
        calls.push('save');
        return 1;
      }),
      findById: jest.fn(),
    };
    const { publisher, publishedEvents } = eventPublisher();
    const handler = new CaptureNeedHandler(repository, publisher);

    const id = await handler.execute(new CaptureNeedCommand('session-abc', 'SUV', 'familia numerosa'));

    expect(repository.findBySessionId).toHaveBeenCalledWith('session-abc');
    expect(calls).toEqual(['findBySessionId', 'save', 'save']);
    // el id de la Profile es el asignado en el save de creación (1) — el
    // segundo save() es un update sobre la misma fila, no genera id nuevo.
    expect(id).toBe(1);
    expect(publishedEvents()).toHaveLength(1);
    expect(publishedEvents()[0]).toBeInstanceOf(NeedCapturedEvent);
    expect(publishedEvents()[0].category).toBe('SUV');
  });

  it('reuses an existing Profile for the session instead of creating a new one', async () => {
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
    const { publisher } = eventPublisher();
    const handler = new CaptureNeedHandler(repository, publisher);

    const id = await handler.execute(new CaptureNeedCommand('session-existing', 'PICKUP', 'trabajo de campo'));

    expect(repository.save).toHaveBeenCalledTimes(1); // no create-save, only the capture-save
    expect(id).toBe(9);
  });
});
