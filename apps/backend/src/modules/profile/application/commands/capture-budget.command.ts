export class CaptureBudgetCommand {
  constructor(
    public readonly sessionId: string,
    public readonly min: number,
    public readonly max: number,
  ) {}
}
