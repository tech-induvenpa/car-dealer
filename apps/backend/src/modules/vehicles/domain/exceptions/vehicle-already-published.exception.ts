import { DomainException } from '../../../../shared/domain/domain.exception';

export class VehicleAlreadyPublishedException extends DomainException {
  constructor(id: number) {
    super(`El vehículo ${id} ya está publicado`);
  }
}
