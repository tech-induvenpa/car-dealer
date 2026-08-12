import { DomainException } from '../../../../shared/domain/domain.exception';

export class InvalidVehicleYearException extends DomainException {
  constructor(year: number, minYear: number, maxYear: number) {
    super(`El año ${year} está fuera de rango [${minYear}, ${maxYear}]`);
  }
}
