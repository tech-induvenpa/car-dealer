import { NeedCategory } from '../profile.aggregate';
import { normalizeWizardBudget } from './budget-normalizer';

// Atajo: una opción de conjunto cerrado que el comprador tapea en vez de
// escribir. Su significado lo conoce el sistema de antemano, así que el hecho
// se captura de forma determinista, SIN pasar por el modelo (ver
// profile/CONTEXT.md). Es el mismo mecanismo que antes se llamaba Wizard;
// cambió dónde se presenta, no cómo captura.
//
// Importa más de lo que parece: Necesidad y Presupuesto son exactamente los
// dos datos que evalúa assertCanRequestContact. Si dependieran de que el LLM
// los extraiga bien, las entradas de un invariante duro serían probabilísticas.
export type ShortcutFact =
  | { kind: 'NEED'; category: NeedCategory }
  | { kind: 'BUDGET'; min: number; max: number };

const NEED_SHORTCUTS: Record<string, NeedCategory> = {
  'uso-familiar': 'SUV',
  'uso-ciudad': 'COMPACTO',
  'uso-trabajo': 'PICKUP',
};

// El tope tal como lo ofrecía el Wizard; '' es "más de $35.000" y lo
// normaliza budget-normalizer, que se reusa tal cual.
const BUDGET_SHORTCUTS: Record<string, number | ''> = {
  'presupuesto-hasta-20000': 20000,
  'presupuesto-20000-35000': 35000,
  'presupuesto-mas-de-35000': '',
};

// Un identificador desconocido devuelve null y el turno sigue como texto
// libre — nunca rompe la conversación.
export function resolveShortcut(shortcutId: string | undefined | null): ShortcutFact | null {
  if (!shortcutId) return null;

  const need = NEED_SHORTCUTS[shortcutId];
  if (need) return { kind: 'NEED', category: need };

  if (shortcutId in BUDGET_SHORTCUTS) {
    const { min, max } = normalizeWizardBudget(BUDGET_SHORTCUTS[shortcutId]);
    return { kind: 'BUDGET', min, max };
  }

  return null;
}
