import { DomainException } from '../../../../shared/domain/domain.exception';

export class InvalidBudgetRangeException extends DomainException {
  constructor() {
    super('El presupuesto debe tener un piso >= 0 y un techo mayor o igual al piso');
  }
}
