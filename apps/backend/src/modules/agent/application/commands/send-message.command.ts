export class SendMessageCommand {
  constructor(
    public readonly sessionId: string,
    public readonly message: string,
    // omitir siempre abandona la ACTIVA existente (si hay) y crea una
    // nueva — nunca "encuentra" una vieja en silencio (ver CEB-36-UI-01).
    public readonly conversationId?: number,
  ) {}
}
