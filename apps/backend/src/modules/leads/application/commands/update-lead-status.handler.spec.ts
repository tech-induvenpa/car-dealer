import { InvalidLeadStatusTransitionException } from '../../domain/exceptions/invalid-lead-status-transition.exception';
import { LeadNotFoundException } from '../../domain/exceptions/lead-not-found.exception';
import { Lead } from '../../domain/lead.aggregate';
import { LeadStatus } from '../../domain/lead-status';
import { LeadRepository } from '../../domain/ports/lead.repository';
import { UpdateLeadStatusCommand } from './update-lead-status.command';
import { UpdateLeadStatusHandler } from './update-lead-status.handler';

function existingLead(status: LeadStatus): Lead {
  return Lead.reconstruct({
    id: 1,
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+58 412 1234567',
    vehicleIds: [1, 2],
    status,
  });
}

describe('UpdateLeadStatusHandler', () => {
  it('throws LeadNotFoundException and never saves when the id does not exist', async () => {
    const repository: jest.Mocked<LeadRepository> = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const handler = new UpdateLeadStatusHandler(repository);

    await expect(
      handler.execute(new UpdateLeadStatusCommand(999, LeadStatus.CONTACTADO)),
    ).rejects.toThrow(LeadNotFoundException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('persists a valid transition', async () => {
    const lead = existingLead(LeadStatus.NUEVO);
    const repository: jest.Mocked<LeadRepository> = {
      findById: jest.fn().mockResolvedValue(lead),
      save: jest.fn().mockResolvedValue(1),
    };
    const handler = new UpdateLeadStatusHandler(repository);

    await handler.execute(new UpdateLeadStatusCommand(1, LeadStatus.CONTACTADO));

    expect(lead.status).toBe(LeadStatus.CONTACTADO);
    expect(repository.save).toHaveBeenCalledWith(lead);
  });

  it('rejects an invalid transition and never saves', async () => {
    const lead = existingLead(LeadStatus.CONTACTADO);
    const repository: jest.Mocked<LeadRepository> = {
      findById: jest.fn().mockResolvedValue(lead),
      save: jest.fn(),
    };
    const handler = new UpdateLeadStatusHandler(repository);

    await expect(
      handler.execute(new UpdateLeadStatusCommand(1, LeadStatus.NUEVO)),
    ).rejects.toThrow(InvalidLeadStatusTransitionException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(lead.status).toBe(LeadStatus.CONTACTADO);
  });
});
