import { Lead as LeadRow } from '@prisma/client';
import { Lead } from '../../domain/lead.aggregate';
import { LeadStatus } from '../../domain/lead-status';
import { LeadMapper } from './lead.mapper';

// Round-trip explícito por convención ddd-hexa: cualquier campo nuevo en un
// aggregate ya mapeado exige este test, porque un mapper whitelist puede
// omitir el campo en silencio sin que el build se rompa.
function roundTrip(lead: Lead): Lead {
  const persisted = LeadMapper.toPersistence(lead);
  const row = { id: lead.id ?? 1, ...persisted } as unknown as LeadRow;
  return LeadMapper.toDomain(row);
}

describe('LeadMapper round-trip', () => {
  it('reproduces profileId when it has a value', () => {
    const lead = Lead.reconstruct({
      id: 1,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+58 412 1234567',
      vehicleIds: [1, 2],
      status: LeadStatus.NUEVO,
      profileId: 42,
    });

    expect(roundTrip(lead).profileId).toBe(42);
  });

  it('reproduces profileId when it is null (e.g. a Lead from the Wizard)', () => {
    const lead = Lead.reconstruct({
      id: 2,
      firstName: 'Ana',
      lastName: 'García',
      phone: '+58 412 7654321',
      vehicleIds: [3],
      status: LeadStatus.NUEVO,
      profileId: null,
    });

    expect(roundTrip(lead).profileId).toBeNull();
  });

  it('reproduces every other field unchanged (no silent field drop)', () => {
    const lead = Lead.reconstruct({
      id: 3,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+58 412 1234567',
      vehicleIds: [1, 2],
      status: LeadStatus.CONTACTADO,
      profileId: 7,
    });

    const reproduced = roundTrip(lead);
    expect(reproduced.firstName).toBe(lead.firstName);
    expect(reproduced.lastName).toBe(lead.lastName);
    expect(reproduced.phone).toBe(lead.phone);
    expect(reproduced.vehicleIds).toEqual(lead.vehicleIds);
    expect(reproduced.status).toBe(lead.status);
    expect(reproduced.profileId).toBe(lead.profileId);
  });
});
