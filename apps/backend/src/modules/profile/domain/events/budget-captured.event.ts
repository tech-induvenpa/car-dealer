export class BudgetCapturedEvent {
  constructor(
    public readonly profileId: number,
    public readonly min: number,
    public readonly max: number,
  ) {}
}
