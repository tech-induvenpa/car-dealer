import { DomainException } from '../../../../shared/domain/domain.exception';

// ponytail: mismo mensaje genérico para password incorrecta y email
// inexistente — no debe ser posible distinguir cuál fue el dato erróneo.
export class InvalidCredentialsException extends DomainException {
  readonly httpStatus = 401;

  constructor() {
    super('Credenciales inválidas');
  }
}
