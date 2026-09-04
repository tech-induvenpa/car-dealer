export class SendMessageCommand {
  constructor(
    public readonly sessionId: string,
    public readonly message: string,
    // omitir siempre abandona la ACTIVA existente (si hay) y crea una
    // nueva — nunca "encuentra" una vieja en silencio (ver CEB-36-UI-01).
    public readonly conversationId?: number,
    // CEB-81: identificador del Atajo que el comprador tapeó, si tapeó uno.
    // Su hecho se aplica al Perfil de forma determinista ANTES de llamar al
    // modelo — ver resolveShortcut y el orden en el handler.
    public readonly shortcutId?: string,
  ) {}
}
