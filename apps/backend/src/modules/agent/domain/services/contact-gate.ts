import { Profile } from '../../../profile/domain/profile.aggregate';
import { isQualifiedBuyer } from './buyer-qualification';
import { ContactNotYetSignaledException } from '../exceptions/contact-not-yet-signaled.exception';

// Deep module: prueba INV-4 de forma determinista. "Señal de intención",
// para efectos de este gate, es deliberadamente simple — presupuesto +
// necesidad ya capturados — no la clasificación completa de Etapa (ver
// funnel-stage.ts, que es un concepto hermano pero más amplio y usado solo
// para logging/comportamiento, no para forzar nada).
// Gobierna únicamente si el Agente puede PEDIR contacto. Desde CEB-85 ya no
// decide si el contacto se GUARDA — el que el comprador ofrece se guarda
// siempre (ver profile.captureContact). Antes una sola condición gobernaba
// las dos cosas y el contacto ofrecido espontáneamente se perdía en silencio.
// profile null = nunca calificado (ADR-0012).
export function assertCanRequestContact(profile: Profile | null): void {
  if (!isQualifiedBuyer(profile)) {
    throw new ContactNotYetSignaledException();
  }
}
