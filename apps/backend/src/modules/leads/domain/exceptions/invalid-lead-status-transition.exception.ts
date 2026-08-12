import { DomainException } from '../../../../shared/domain/domain.exception';
import { LeadStatus } from '../lead-status';

export class InvalidLeadStatusTransitionException extends DomainException {
  constructor(from: LeadStatus, to: LeadStatus) {
    super(`No se puede cambiar el estado de ${from} a ${to}`);
  }
}
