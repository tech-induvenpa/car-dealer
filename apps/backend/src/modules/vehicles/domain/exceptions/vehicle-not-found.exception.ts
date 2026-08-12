import { DomainException } from '../../../../shared/domain/domain.exception';

export class VehicleNotFoundException extends DomainException {
  readonly httpStatus = 404;

  constructor(id: number) {
    super(`Vehículo ${id} no encontrado`);
  }
}
