import { DomainException } from '../../../../shared/domain/domain.exception';

export class ContactNotYetSignaledException extends DomainException {
  constructor() {
    super(
      'No se puede solicitar contacto todavía — la Conversación no llegó a Señal de intención (falta presupuesto y/o necesidad en el Perfil)',
    );
  }
}
