import { Lead } from '../lead.aggregate';

export const LEAD_REPOSITORY = Symbol('LeadRepository');

export interface LeadRepository {
  save(lead: Lead): Promise<number>;
  findById(id: number): Promise<Lead | null>;
}
