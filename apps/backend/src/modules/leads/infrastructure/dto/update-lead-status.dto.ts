import { IsEnum } from 'class-validator';
import { LeadStatus } from '../../domain/lead-status';

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus) status: LeadStatus;
}
