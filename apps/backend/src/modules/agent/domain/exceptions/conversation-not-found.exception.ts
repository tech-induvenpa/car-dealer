import { DomainException } from '../../../../shared/domain/domain.exception';

export class ConversationNotFoundException extends DomainException {
  readonly httpStatus = 404;

  constructor() {
    super('La Conversación indicada no existe, no pertenece a esta sesión, o ya no está ACTIVA');
  }
}
