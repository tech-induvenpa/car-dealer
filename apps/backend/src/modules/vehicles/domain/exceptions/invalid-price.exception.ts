import { DomainException } from '../../../../shared/domain/domain.exception';

export class InvalidPriceException extends DomainException {
  constructor(amount: number) {
    super(`El precio debe ser positivo, se recibió ${amount}`);
  }
}
