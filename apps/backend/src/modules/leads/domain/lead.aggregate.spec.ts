import { LeadSubmittedEvent } from './events/lead-submitted.event';
import { EmptyVehicleSelectionException } from './exceptions/empty-vehicle-selection.exception';
import { InvalidLeadStatusTransitionException } from './exceptions/invalid-lead-status-transition.exception';
import { CreateLeadProps, Lead } from './lead.aggregate';
import { LeadStatus } from './lead-status';

function validProps(overrides: Partial<CreateLeadProps> = {}): CreateLeadProps {
  return {
    firstName: 'Juan',
    lastName: 'Pérez',
    phone: '+58 412 1234567',
    vehicleIds: [1, 2],
    ...overrides,
  };
}

describe('Lead aggregate', () => {
  it('creates a lead with valid props, status NUEVO', () => {
    const lead = Lead.create(validProps());
    expect(lead.status).toBe(LeadStatus.NUEVO);
    expect(lead.id).toBeNull();
  });

  it('rejects an empty vehicleIds selection', () => {
    expect(() => Lead.create(validProps({ vehicleIds: [] }))).toThrow(
      EmptyVehicleSelectionException,
    );
  });

  describe('recordSubmission', () => {
    it('assigns the persisted id and applies LeadSubmittedEvent with it', () => {
      const lead = Lead.create(validProps());
      lead.recordSubmission(42);

      expect(lead.id).toBe(42);
      const events = lead.getUncommittedEvents() as LeadSubmittedEvent[];
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(LeadSubmittedEvent);
      expect(events[0].leadId).toBe(42);
      expect(events[0].vehicleIds).toEqual([1, 2]);
    });
  });

  describe('changeStatus', () => {
    function reconstructed(status: LeadStatus): Lead {
      return Lead.reconstruct({ ...validProps(), id: 1, status });
    }

    it('allows NUEVO -> CONTACTADO', () => {
      const lead = reconstructed(LeadStatus.NUEVO);
      lead.changeStatus(LeadStatus.CONTACTADO);
      expect(lead.status).toBe(LeadStatus.CONTACTADO);
    });

    it('allows NUEVO -> CONVERTIDO directly (can skip CONTACTADO)', () => {
      const lead = reconstructed(LeadStatus.NUEVO);
      lead.changeStatus(LeadStatus.CONVERTIDO);
      expect(lead.status).toBe(LeadStatus.CONVERTIDO);
    });

    it('allows CONTACTADO -> DESCARTADO', () => {
      const lead = reconstructed(LeadStatus.CONTACTADO);
      lead.changeStatus(LeadStatus.DESCARTADO);
      expect(lead.status).toBe(LeadStatus.DESCARTADO);
    });

    it('rejects going backwards (CONTACTADO -> NUEVO)', () => {
      const lead = reconstructed(LeadStatus.CONTACTADO);
      expect(() => lead.changeStatus(LeadStatus.NUEVO)).toThrow(
        InvalidLeadStatusTransitionException,
      );
      expect(lead.status).toBe(LeadStatus.CONTACTADO);
    });

    it('rejects jumping between the two final states (CONVERTIDO -> DESCARTADO)', () => {
      const lead = reconstructed(LeadStatus.CONVERTIDO);
      expect(() => lead.changeStatus(LeadStatus.DESCARTADO)).toThrow(
        InvalidLeadStatusTransitionException,
      );
    });

    it('rejects any transition out of a final state', () => {
      const lead = reconstructed(LeadStatus.DESCARTADO);
      expect(() => lead.changeStatus(LeadStatus.CONTACTADO)).toThrow(
        InvalidLeadStatusTransitionException,
      );
    });
  });
});
