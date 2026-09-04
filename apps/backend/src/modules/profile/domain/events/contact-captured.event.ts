// El comprador ofreció su contacto. Se publica siempre que se captura, sin
// importar si ese contacto llega o no a materializarse en un Lead — eso lo
// decide Leads con su propia regla (mínimo 1 Vehículo).
export class ContactCapturedEvent {
  constructor(
    public readonly profileId: number,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phone: string,
  ) {}
}
