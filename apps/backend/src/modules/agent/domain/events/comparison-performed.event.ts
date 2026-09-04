// El Agente contrastó un par de Vehículos. Mide ADOPCIÓN, no éxito: el Agente
// puede contrastar un par y no llegar a Veredicto (ver regla 9 del PRD de
// producto), así que esto y VerdictDeliveredEvent cuentan cosas distintas.
//
// Reusa el tipo COMPARISON_PERFORMED que ya existe, así que el `topCompared`
// del dashboard sigue funcionando igual — solo cambia quién lo dispara.
export class ComparisonPerformedEvent {
  constructor(
    public readonly sessionId: string,
    public readonly vehicleIds: number[],
  ) {}
}
