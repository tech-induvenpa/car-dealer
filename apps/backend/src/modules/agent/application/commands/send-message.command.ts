export class SendMessageCommand {
  constructor(
    public readonly sessionId: string,
    public readonly message: string,
  ) {}
}
