import { InvalidBudgetRangeException } from '../exceptions/invalid-budget-range.exception';

export class BudgetRange {
  private constructor(
    private readonly _min: number,
    private readonly _max: number,
  ) {}

  static create(min: number, max: number): BudgetRange {
    if (min < 0 || max < min) {
      throw new InvalidBudgetRangeException();
    }
    return new BudgetRange(min, max);
  }

  static reconstruct(min: number, max: number): BudgetRange {
    return new BudgetRange(min, max);
  }

  get min(): number {
    return this._min;
  }

  get max(): number {
    return this._max;
  }
}
