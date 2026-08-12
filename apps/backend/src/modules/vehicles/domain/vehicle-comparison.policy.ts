import { VehicleCategory } from './vehicle-enums';

// ponytail: campos con dirección definida (whitelist ADR-0006). El resto de
// la ficha técnica (peso, dimensiones, transmisión, etc.) es NOT_RANKED
// implícito — nunca aparece en `winners`.
type NumericField =
  | 'price'
  | 'horsepowerHp'
  | 'torqueNm'
  | 'warrantyYears'
  | 'warrantyKm'
  | 'trunkCapacityL'
  | 'airbagsCount'
  | 'fuelEconomyNormalizedKmPerL';

type BooleanField =
  | 'hasAbs'
  | 'hasStabilityControl'
  | 'hasRearCamera'
  | 'hasBluetooth'
  | 'hasCarPlay';

const HIGHER_BETTER_NUMERIC: NumericField[] = [
  'horsepowerHp',
  'torqueNm',
  'warrantyYears',
  'warrantyKm',
  'trunkCapacityL',
  'airbagsCount',
  'fuelEconomyNormalizedKmPerL',
];

const LOWER_BETTER_NUMERIC: NumericField[] = ['price'];

const BOOLEAN_FIELDS: BooleanField[] = [
  'hasAbs',
  'hasStabilityControl',
  'hasRearCamera',
  'hasBluetooth',
  'hasCarPlay',
];

export interface ComparableVehicle {
  id: number;
  category: VehicleCategory;
  price: number;
  horsepowerHp: number | null;
  torqueNm: number | null;
  warrantyYears: number | null;
  warrantyKm: number | null;
  trunkCapacityL: number | null;
  airbagsCount: number | null;
  fuelEconomyNormalizedKmPerL: number | null;
  hasAbs: boolean;
  hasStabilityControl: boolean;
  hasRearCamera: boolean;
  hasBluetooth: boolean;
  hasCarPlay: boolean;
}

export interface ComparisonResult {
  categoryMismatch: boolean;
  // campo -> ids ganadores (empate = varios); nunca incluye un campo NOT_RANKED,
  // y se omite el campo por completo si todos los vehículos comparados empatan.
  winners: Record<string, number[]>;
}

// ponytail: domain service sin estado — la dirección de "mejor" es una
// propiedad estática del campo, no de la instancia (ver ADR-0006).
export class VehicleComparisonPolicy {
  static evaluate(vehicles: ComparableVehicle[]): ComparisonResult {
    const winners: Record<string, number[]> = {};

    for (const field of HIGHER_BETTER_NUMERIC) {
      const result = VehicleComparisonPolicy.numericWinners(vehicles, field, 'HIGHER_BETTER');
      if (result) winners[field] = result;
    }
    for (const field of LOWER_BETTER_NUMERIC) {
      const result = VehicleComparisonPolicy.numericWinners(vehicles, field, 'LOWER_BETTER');
      if (result) winners[field] = result;
    }
    for (const field of BOOLEAN_FIELDS) {
      const result = VehicleComparisonPolicy.booleanWinners(vehicles, field);
      if (result) winners[field] = result;
    }

    return {
      categoryMismatch: new Set(vehicles.map((v) => v.category)).size > 1,
      winners,
    };
  }

  private static numericWinners(
    vehicles: ComparableVehicle[],
    field: NumericField,
    direction: 'HIGHER_BETTER' | 'LOWER_BETTER',
  ): number[] | null {
    const withValue = vehicles.filter((v) => v[field] != null);
    if (withValue.length < 2) return null;

    const values = withValue.map((v) => v[field] as number);
    if (new Set(values).size === 1) return null;

    const best = direction === 'HIGHER_BETTER' ? Math.max(...values) : Math.min(...values);
    return withValue.filter((v) => v[field] === best).map((v) => v.id);
  }

  private static booleanWinners(vehicles: ComparableVehicle[], field: BooleanField): number[] | null {
    const hasTrue = vehicles.some((v) => v[field] === true);
    const hasFalse = vehicles.some((v) => v[field] === false);
    if (!hasTrue || !hasFalse) return null;
    return vehicles.filter((v) => v[field] === true).map((v) => v.id);
  }
}
