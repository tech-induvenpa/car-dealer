import { EventBus, EventPublisher } from '@nestjs/cqrs';
import { LeadSubmittedEvent } from '../../domain/events/lead-submitted.event';
import { LeadRepository } from '../../domain/ports/lead.repository';
import { CreateLeadCommand } from './create-lead.command';
import { CreateLeadHandler } from './create-lead.handler';

describe('CreateLeadHandler', () => {
  it('publishes exactly one LeadSubmittedEvent, with the id from save(), only after persisting', async () => {
    const calls: string[] = [];
    const repository: jest.Mocked<LeadRepository> = {
      save: jest.fn().mockImplementation(async () => {
        calls.push('save');
        return 7;
      }),
      findById: jest.fn(),
    };
    let publishedEvents: LeadSubmittedEvent[] = [];
    // ponytail: AggregateRoot.commit() pasa el array interno por referencia
    // y lo vacía justo después — hay que copiarlo en el momento del call,
    // no leerlo de mock.calls después (llegaría vacío).
    const publishAll = jest.fn().mockImplementation((events: LeadSubmittedEvent[]) => {
      calls.push('publish');
      publishedEvents = [...events];
    });
    const eventBus = { publish: jest.fn(), publishAll } as unknown as EventBus;
    const handler = new CreateLeadHandler(repository, new EventPublisher(eventBus));

    const id = await handler.execute(
      new CreateLeadCommand({
        firstName: 'Juan',
        lastName: 'Pérez',
        phone: '+58 412 1234567',
        vehicleIds: [1, 2],
      }),
    );

    expect(id).toBe(7);
    expect(publishAll).toHaveBeenCalledTimes(1);
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]).toBeInstanceOf(LeadSubmittedEvent);
    expect(publishedEvents[0].leadId).toBe(7);
    expect(publishedEvents[0].vehicleIds).toEqual([1, 2]);
    // save() debe ocurrir antes que publishAll() — nunca despachar antes de persistir.
    expect(calls).toEqual(['save', 'publish']);
  });
});
