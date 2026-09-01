import { Profile } from '../../../profile/domain/profile.aggregate';
import { Conversation } from '../conversation.aggregate';

export type FunnelStage = 'ENTRADA' | 'CALIFICACION_TEMPRANA' | 'DESCUBRIMIENTO' | 'SENAL_DE_INTENCION';

// ponytail: v1 solo cubre las primeras 4 etapas del funnel conceptualizado
// en el PRD (CEB-35) — Comparación asistida / Captura de contacto /
// Cotización necesitan saber qué vehículos sugirió el Agente (no existe
// todavía, ver CatalogGroundingGuard en CEB-42) o si ya hay un Lead (CEB-47).
// No es una máquina de estados: se reevalúa desde cero en cada llamada, así
// que SÍ puede "retroceder" — no hay tabla de transiciones como la de
// Estado (ver agent/CONTEXT.md, "Etapa del funnel" en Language).
export function inferFunnelStage(conversation: Conversation, profile: Profile): FunnelStage {
  if (conversation.turns.length === 0) {
    return 'ENTRADA';
  }

  const qualified = profile.budgetRange !== null && profile.needs.length > 0;
  if (!qualified) {
    return 'CALIFICACION_TEMPRANA';
  }

  const lastTurn = conversation.turns[conversation.turns.length - 1];
  if (lastTurn.intentSignal === 'DECISIVO') {
    return 'SENAL_DE_INTENCION';
  }

  // EXPLORATORIO explícito, o sin señal de turno todavía (stub de hoy) —
  // en ambos casos se reporta Descubrimiento, nunca Señal de intención,
  // hasta que un turno reciente diga lo contrario.
  return 'DESCUBRIMIENTO';
}
