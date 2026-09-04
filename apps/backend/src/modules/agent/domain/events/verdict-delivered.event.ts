// El criterio de éxito del pivote conversacional. Se publica solo cuando un
// Veredicto pasó la verificación contra los Ganadores de comparación — uno
// rechazado por verdict-verifier nunca llega acá.
//
// Es un evento propio y NO una Etapa del funnel: la Etapa se reevalúa cada
// turno y puede retroceder, mientras que un Veredicto entregado es un hecho
// puntual que ocurrió. Meterlo como Etapa lo volvería contable de forma rara.
export class VerdictDeliveredEvent {
  constructor(
    public readonly conversationId: number,
    public readonly recommendedVehicleId: number,
    public readonly comparedVehicleIds: number[],
    public readonly decisiveField: string,
  ) {}
}
