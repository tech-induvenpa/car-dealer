import { DomainException } from '../../../../shared/domain/domain.exception';
import { ConversationStatus } from '../conversation-status';

export class InvalidConversationStatusTransitionException extends DomainException {
  constructor(from: ConversationStatus, to: ConversationStatus) {
    super(`No se puede pasar el Estado de la Conversación de ${from} a ${to}`);
  }
}
