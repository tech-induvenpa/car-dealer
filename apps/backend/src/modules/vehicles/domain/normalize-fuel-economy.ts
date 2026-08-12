import { FuelEconomyUnit } from './vehicle-enums';

const LITERS_PER_GALLON = 3.78541;

// ponytail: única conversión real del módulo — todo lo demás en la ficha
// técnica es un campo primitivo sin comportamiento propio (ver ADR-0005).
export function normalizeFuelEconomy(value: number, unit: FuelEconomyUnit): number {
  if (unit === FuelEconomyUnit.KM_POR_GAL) {
    return value / LITERS_PER_GALLON;
  }
  return 100 / value;
}
