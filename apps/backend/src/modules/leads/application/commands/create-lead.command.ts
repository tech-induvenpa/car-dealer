import { CreateLeadProps } from '../../domain/lead.aggregate';

export class CreateLeadCommand {
  constructor(public readonly props: CreateLeadProps) {}
}
