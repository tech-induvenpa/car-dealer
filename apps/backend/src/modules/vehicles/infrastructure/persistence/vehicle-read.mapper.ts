import { Vehicle as VehicleRow } from '@prisma/client';

// ponytail: lado de lectura bypasea el aggregate (convención ddd-hexa para
// Queries) — DTO plano directo de Prisma, solo convierte los Decimal a number
// para que el contrato JSON sea consistente con los DTOs de escritura.
export type VehicleReadDto = Omit<
  VehicleRow,
  'price' | 'fuelEconomyValue' | 'fuelEconomyNormalizedKmPerL'
> & {
  price: number;
  fuelEconomyValue: number | null;
  fuelEconomyNormalizedKmPerL: number | null;
};

export function toVehicleReadDto(row: VehicleRow): VehicleReadDto {
  return {
    ...row,
    price: Number(row.price),
    fuelEconomyValue: row.fuelEconomyValue ? Number(row.fuelEconomyValue) : null,
    fuelEconomyNormalizedKmPerL: row.fuelEconomyNormalizedKmPerL
      ? Number(row.fuelEconomyNormalizedKmPerL)
      : null,
  };
}
