import { normalizeFuelEconomy } from './normalize-fuel-economy';
import { FuelEconomyUnit } from './vehicle-enums';

describe('normalizeFuelEconomy', () => {
  it('converts KM_POR_GAL to KM_POR_L', () => {
    // 37.85 km/gal ≈ 10 km/L (1 galón = 3.78541 L)
    expect(normalizeFuelEconomy(37.8541, FuelEconomyUnit.KM_POR_GAL)).toBeCloseTo(10, 2);
  });

  it('converts L_POR_100KM to KM_POR_L', () => {
    // 10 L/100km == 10 km/L
    expect(normalizeFuelEconomy(10, FuelEconomyUnit.L_POR_100KM)).toBeCloseTo(10, 2);
  });
});
