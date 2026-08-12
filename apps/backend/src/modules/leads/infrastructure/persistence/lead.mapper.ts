import { Lead as LeadRow, Prisma } from '@prisma/client';
import { Lead } from '../../domain/lead.aggregate';
import { LeadStatus } from '../../domain/lead-status';

export class LeadMapper {
  static toDomain(row: LeadRow): Lead {
    return Lead.reconstruct({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      vehicleIds: row.vehicleIds,
      status: row.status as unknown as LeadStatus,
    });
  }

  static toPersistence(lead: Lead): Omit<Prisma.LeadCreateInput, 'id'> {
    return {
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      vehicleIds: lead.vehicleIds,
      status: lead.status as unknown as Prisma.LeadCreateInput['status'],
    };
  }
}
