import { DomainException } from '../../../../shared/domain/domain.exception';

export class LeadNotFoundException extends DomainException {
  readonly httpStatus = 404;

  constructor(id: number) {
    super(`Lead ${id} no encontrado`);
  }
}
