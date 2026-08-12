import { LeadStatus } from '../../domain/lead-status';

export class UpdateLeadStatusCommand {
  constructor(
    public readonly id: number,
    public readonly status: LeadStatus,
  ) {}
}
