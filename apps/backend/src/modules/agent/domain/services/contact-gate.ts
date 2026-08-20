import { Profile } from '../../../profile/domain/profile.aggregate';
import { ContactNotYetSignaledException } from '../exceptions/contact-not-yet-signaled.exception';

// Deep module: prueba INV-4 de forma determinista. "Señal de intención",
// para efectos de este gate, es deliberadamente simple — presupuesto +
// necesidad ya capturados — no la clasificación completa de Etapa (ver
// funnel-stage.ts, que es un concepto hermano pero más amplio y usado solo
// para logging/comportamiento, no para forzar nada).
export function assertCanRequestContact(profile: Profile): void {
  const qualified = profile.budgetRange !== null && profile.needs.length > 0;
  if (!qualified) {
    throw new ContactNotYetSignaledException();
  }
}
