// ponytail: payload mínimo (sin PII) — Analytics es el único consumidor
// previsto y solo necesita contar/agrupar por vehículo (ver ADR-0004).
export class LeadSubmittedEvent {
  constructor(
    public readonly leadId: number,
    public readonly vehicleIds: number[],
  ) {}
}
