import { normalizeWizardBudget } from './budget-normalizer';

describe('normalizeWizardBudget', () => {
  it.each([
    [20000, { min: 0, max: 20000 }],
    [35000, { min: 0, max: 35000 }],
  ])('normalizes a finite tope %s to a range with floor 0', (tope, expected) => {
    expect(normalizeWizardBudget(tope as number)).toEqual(expected);
  });

  it('normalizes "" (más de $35,000) to a range starting at 35000, not floor 0', () => {
    const result = normalizeWizardBudget('');
    expect(result.min).toBe(35000);
    expect(result.max).toBeGreaterThanOrEqual(result.min);
  });
});
