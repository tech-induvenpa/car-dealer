import { DomainException } from '../../../../shared/domain/domain.exception';

export class VehicleAlreadyArchivedException extends DomainException {
  constructor(id: number) {
    super(`El vehículo ${id} ya está archivado`);
  }
}
