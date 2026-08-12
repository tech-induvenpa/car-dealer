import { InvalidPriceException } from './exceptions/invalid-price.exception';
import { InvalidVehicleYearException } from './exceptions/invalid-vehicle-year.exception';
import { CreateVehicleProps, Vehicle } from './vehicle.aggregate';
import {
  Brand,
  DriveType,
  FuelEconomyUnit,
  FuelType,
  TransmissionType,
  VehicleCategory,
} from './vehicle-enums';

function validProps(overrides: Partial<CreateVehicleProps> = {}): CreateVehicleProps {
  return {
    brand: Brand.CHANGAN,
    model: 'CS35 Plus',
    trim: 'Premium AWD',
    year: 2024,
    price: 24000,
    priceIncludes: 'IVA, IGTF, matriculación',
    mainImageUrl: 'https://example.com/cs35.jpg',
    category: VehicleCategory.SUV,
    specs: {
      displacementCc: 1500,
      cylinders: 4,
      horsepowerHp: 150,
      torqueNm: 210,
      fuelType: FuelType.GASOLINA,
      transmissionType: TransmissionType.CVT,
      transmissionSpeeds: null,
      driveType: DriveType.AWD_4X4,
      lengthMm: 4515,
      widthMm: 1850,
      heightMm: 1685,
      wheelbaseMm: 2670,
      trunkCapacityL: 543,
      weightKg: 1450,
      passengerCapacity: 5,
      fuelEconomyValue: null,
      fuelEconomyUnit: null,
      tankCapacityL: 55,
      airbagsCount: 6,
      hasAbs: true,
      hasStabilityControl: true,
      hasRearCamera: true,
      seatType: 'Cuero',
      hasBluetooth: true,
      hasCarPlay: true,
      warrantyYears: 5,
      warrantyKm: 150000,
      highlights: ['Sunroof eléctrico'],
    },
    ...overrides,
  };
}

describe('Vehicle aggregate', () => {
  it('creates a vehicle with valid props', () => {
    const vehicle = Vehicle.create(validProps());
    expect(vehicle.price.amount).toBe(24000);
    expect(vehicle.isPublished).toBe(true);
    expect(vehicle.id).toBeNull();
  });

  it('rejects a non-positive price', () => {
    expect(() => Vehicle.create(validProps({ price: 0 }))).toThrow(InvalidPriceException);
    expect(() => Vehicle.create(validProps({ price: -100 }))).toThrow(InvalidPriceException);
  });

  it('rejects a year before 1990', () => {
    expect(() => Vehicle.create(validProps({ year: 1989 }))).toThrow(
      InvalidVehicleYearException,
    );
  });

  it('rejects a year more than one year in the future', () => {
    const farFuture = new Date().getFullYear() + 2;
    expect(() => Vehicle.create(validProps({ year: farFuture }))).toThrow(
      InvalidVehicleYearException,
    );
  });

  it('normalizes fuel economy to km/L at creation', () => {
    const vehicle = Vehicle.create(
      validProps({
        specs: {
          ...validProps().specs,
          fuelEconomyValue: 10,
          fuelEconomyUnit: FuelEconomyUnit.L_POR_100KM,
        },
      }),
    );
    expect(vehicle.fuelEconomyNormalizedKmPerL).toBeCloseTo(10, 2);
    // el valor tal cual cargado se conserva sin tocar
    expect(vehicle.specs.fuelEconomyValue).toBe(10);
    expect(vehicle.specs.fuelEconomyUnit).toBe(FuelEconomyUnit.L_POR_100KM);
  });

  it('leaves normalized fuel economy null when not provided', () => {
    const vehicle = Vehicle.create(validProps());
    expect(vehicle.fuelEconomyNormalizedKmPerL).toBeNull();
  });
});
