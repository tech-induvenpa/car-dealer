import { DomainException } from '../../../../shared/domain/domain.exception';

export class EmptyVehicleSelectionException extends DomainException {
  constructor() {
    super('El Lead debe tener al menos un vehículo asociado');
  }
}
