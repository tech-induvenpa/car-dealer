import { DomainException } from '../../../../shared/domain/domain.exception';

// ponytail: capturar datos requiere un id real porque los eventos de
// captura lo llevan en el payload (para que Analytics pueda correlacionar) —
// mismo motivo por el que Lead.recordSubmission espera a tener id (Rule 3).
export class ProfileNotPersistedException extends DomainException {
  constructor() {
    super('No se puede capturar un dato en un Perfil que todavía no fue persistido');
  }
}
