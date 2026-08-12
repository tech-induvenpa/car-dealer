import { DomainException } from '../../../../shared/domain/domain.exception';

export class InvalidComparisonSizeException extends DomainException {
  constructor(count: number) {
    super(`La comparación requiere entre 2 y 4 vehículos, se recibieron ${count}`);
  }
}
