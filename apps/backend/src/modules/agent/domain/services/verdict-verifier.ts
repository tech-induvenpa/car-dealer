// Deep module: audita el Veredicto que propone el LLM contra los Ganadores de
// comparación que calculó Catalog. Función pura, sin I/O.
//
// Es el hermano exacto de catalog-grounding-guard: ahí se valida que un
// vehicleId afirmado por el modelo exista de verdad; acá, que una afirmación
// de superioridad ("el Seltos, por consumo") sea cierta contra la ficha
// técnica. El LLM redacta; el dominio audita.
//
// Por eso el Campo decisivo viaja estructurado y no se infiere del texto: es
// lo que hace la verificación mecánica en vez de una promesa del prompt.

export interface ProposedVerdict {
  recommendedVehicleId: number;
  decisiveField: string;
  reason: string;
}

export interface Verdict {
  recommendedVehicleId: number;
  comparedVehicleIds: number[];
  decisiveField: string;
  reason: string;
}

// Forma primitiva a propósito (campo -> ids ganadores), no el ComparisonResult
// de Catalog: mismo criterio que CandidateVehicleSpecs en llm.port.ts, el
// Agente no importa tipos de Catalog para no acoplarse a su modelo.
export type WinnersByField = Record<string, number[]>;

export function verifyVerdict(
  proposed: ProposedVerdict | null | undefined,
  winnersByField: WinnersByField,
  comparedVehicleIds: number[],
  // ¿sabemos lo suficiente del comprador como para recomendarle algo A ÉL?
  // Ver buyer-qualification.ts. Sin esto el Veredicto sería una comparación de
  // fichas disfrazada de consejo: el título dice "para ti" y no sabemos quién
  // es. Además se evalúa sobre el Perfil ANTERIOR a este turno, así que la
  // recomendación nunca puede llegar en el mismo turno en que el comprador
  // recién dijo qué busca — siempre hay al menos un turno de por medio.
  buyerQualified: boolean,
): Verdict | null {
  if (!proposed) return null;

  if (!buyerQualified) return null;

  // Un Veredicto es siempre sobre un par (ver CEB-69 BR5).
  if (comparedVehicleIds.length !== 2) return null;

  if (!comparedVehicleIds.includes(proposed.recommendedVehicleId)) return null;

  if (!proposed.reason || proposed.reason.trim() === '') return null;

  // Un campo ausente de winners cubre tres casos a la vez, y los tres deben
  // rechazar: no tiene dirección de "mejor" definida (NOT_RANKED), está
  // empatado, o falta el valor en alguno de los dos vehículos.
  const winners = winnersByField[proposed.decisiveField];
  if (!winners || winners.length !== 1) return null;

  if (winners[0] !== proposed.recommendedVehicleId) return null;

  return {
    recommendedVehicleId: proposed.recommendedVehicleId,
    comparedVehicleIds,
    decisiveField: proposed.decisiveField,
    reason: proposed.reason,
  };
}
