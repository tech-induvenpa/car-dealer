import { DomainException } from '../../../../shared/domain/domain.exception';

export class ConversationNotActiveException extends DomainException {
  constructor() {
    super('No se puede registrar un turno en una Conversación que no está ACTIVA');
  }
}
