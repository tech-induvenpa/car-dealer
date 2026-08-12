import { InvalidPriceException } from './exceptions/invalid-price.exception';
import { InvalidVehicleYearException } from './exceptions/invalid-vehicle-year.exception';
import { VehicleAlreadyArchivedException } from './exceptions/vehicle-already-archived.exception';
import { VehicleAlreadyPublishedException } from './exceptions/vehicle-already-published.exception';
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

  describe('update', () => {
    it('replaces the full ficha técnica', () => {
      const vehicle = Vehicle.create(validProps());
      vehicle.update(validProps({ model: 'CS35 Plus Facelift', price: 26000 }));
      expect(vehicle.model).toBe('CS35 Plus Facelift');
      expect(vehicle.price.amount).toBe(26000);
    });

    it('recomputes normalized fuel economy on update', () => {
      const vehicle = Vehicle.create(validProps());
      vehicle.update(
        validProps({
          specs: {
            ...validProps().specs,
            fuelEconomyValue: 10,
            fuelEconomyUnit: FuelEconomyUnit.L_POR_100KM,
          },
        }),
      );
      expect(vehicle.fuelEconomyNormalizedKmPerL).toBeCloseTo(10, 2);
    });

    it('rejects a non-positive price and leaves the vehicle unchanged', () => {
      const vehicle = Vehicle.create(validProps());
      expect(() => vehicle.update(validProps({ price: 0 }))).toThrow(InvalidPriceException);
      expect(vehicle.price.amount).toBe(24000);
    });

    it('rejects an out-of-range year and leaves the vehicle unchanged', () => {
      const vehicle = Vehicle.create(validProps());
      expect(() => vehicle.update(validProps({ year: 1989 }))).toThrow(
        InvalidVehicleYearException,
      );
      expect(vehicle.year).toBe(2024);
    });
  });

  describe('archive / publish', () => {
    function reconstructedPublished(): Vehicle {
      return Vehicle.reconstruct({
        ...validProps(),
        id: 1,
        fuelEconomyNormalizedKmPerL: null,
        isPublished: true,
      });
    }

    it('archives a published vehicle', () => {
      const vehicle = reconstructedPublished();
      vehicle.archive();
      expect(vehicle.isPublished).toBe(false);
    });

    it('rejects archiving an already-archived vehicle', () => {
      const vehicle = reconstructedPublished();
      vehicle.archive();
      expect(() => vehicle.archive()).toThrow(VehicleAlreadyArchivedException);
    });

    it('publishes an archived vehicle', () => {
      const vehicle = reconstructedPublished();
      vehicle.archive();
      vehicle.publish();
      expect(vehicle.isPublished).toBe(true);
    });

    it('rejects publishing an already-published vehicle', () => {
      const vehicle = reconstructedPublished();
      expect(() => vehicle.publish()).toThrow(VehicleAlreadyPublishedException);
    });

    it('never changes the id when archiving or publishing', () => {
      const vehicle = reconstructedPublished();
      vehicle.archive();
      expect(vehicle.id).toBe(1);
      vehicle.publish();
      expect(vehicle.id).toBe(1);
    });
  });
});
