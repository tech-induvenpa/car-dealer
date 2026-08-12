import { ComparableVehicle, VehicleComparisonPolicy } from './vehicle-comparison.policy';
import { VehicleCategory } from './vehicle-enums';

function vehicle(overrides: Partial<ComparableVehicle> & { id: number }): ComparableVehicle {
  return {
    category: VehicleCategory.SUV,
    price: 20000,
    horsepowerHp: 150,
    torqueNm: 200,
    warrantyYears: 3,
    warrantyKm: 100000,
    trunkCapacityL: 500,
    airbagsCount: 6,
    fuelEconomyNormalizedKmPerL: 12,
    hasAbs: true,
    hasStabilityControl: true,
    hasRearCamera: true,
    hasBluetooth: true,
    hasCarPlay: true,
    ...overrides,
  };
}

describe('VehicleComparisonPolicy', () => {
  it('marks the vehicle with more horsepower as the winner (HIGHER_BETTER)', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, horsepowerHp: 150 }),
      vehicle({ id: 2, horsepowerHp: 200 }),
    ]);
    expect(result.winners.horsepowerHp).toEqual([2]);
  });

  it('marks the vehicle with the lower price as the winner (LOWER_BETTER)', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, price: 25000 }),
      vehicle({ id: 2, price: 20000 }),
    ]);
    expect(result.winners.price).toEqual([2]);
  });

  it('never assigns a winner for a NOT_RANKED / ambiguous field', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1 }),
      vehicle({ id: 2 }),
    ]);
    expect(result.winners.weightKg).toBeUndefined();
    expect(result.winners.transmissionType).toBeUndefined();
  });

  it('uses fuelEconomyNormalizedKmPerL, never a raw value, to decide the fuel economy winner', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, fuelEconomyNormalizedKmPerL: 10 }), // ej. cargado en L_POR_100KM
      vehicle({ id: 2, fuelEconomyNormalizedKmPerL: 15 }), // ej. cargado en KM_POR_GAL
    ]);
    expect(result.winners.fuelEconomyNormalizedKmPerL).toEqual([2]);
  });

  it('includes the category mismatch warning when categories differ', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, category: VehicleCategory.SUV }),
      vehicle({ id: 2, category: VehicleCategory.COMPACTO }),
    ]);
    expect(result.categoryMismatch).toBe(true);
  });

  it('does not warn when all vehicles share the same category', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, category: VehicleCategory.SUV }),
      vehicle({ id: 2, category: VehicleCategory.SUV }),
    ]);
    expect(result.categoryMismatch).toBe(false);
  });

  it('omits a field entirely when every vehicle ties on it', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, horsepowerHp: 150 }),
      vehicle({ id: 2, horsepowerHp: 150 }),
    ]);
    expect(result.winners.horsepowerHp).toBeUndefined();
  });

  it('marks a boolean feature winner only when vehicles differ', () => {
    const result = VehicleComparisonPolicy.evaluate([
      vehicle({ id: 1, hasCarPlay: false }),
      vehicle({ id: 2, hasCarPlay: true }),
    ]);
    expect(result.winners.hasCarPlay).toEqual([2]);
  });
});
