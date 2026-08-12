import { Vehicle as VehicleRow } from '@prisma/client';
import { CreateVehicleProps, Vehicle } from '../../domain/vehicle.aggregate';
import {
  Brand,
  DriveType,
  FuelEconomyUnit,
  FuelType,
  TransmissionType,
  VehicleCategory,
} from '../../domain/vehicle-enums';
import { VehicleMapper } from './vehicle.mapper';

// Whitelist mapper (ver ddd-hexa: "Whitelist mappers silently drop fields")
// — este test round-trip garantiza que un campo nuevo en el aggregate/specs
// no se pierda silenciosamente al pasar por toPersistence/toDomain.
describe('VehicleMapper round-trip', () => {
  const props: CreateVehicleProps = {
    brand: Brand.TOYOTA,
    model: 'Corolla',
    trim: 'XEI',
    year: 2023,
    price: 21000,
    priceIncludes: null,
    mainImageUrl: 'https://example.com/corolla.jpg',
    category: VehicleCategory.SEDAN,
    specs: {
      displacementCc: 1800,
      cylinders: 4,
      horsepowerHp: 139,
      torqueNm: 172,
      fuelType: FuelType.GASOLINA,
      transmissionType: TransmissionType.CVT,
      transmissionSpeeds: null,
      driveType: DriveType.FWD_4X2,
      lengthMm: 4630,
      widthMm: 1780,
      heightMm: 1435,
      wheelbaseMm: 2700,
      trunkCapacityL: 470,
      weightKg: 1320,
      passengerCapacity: 5,
      fuelEconomyValue: 15.5,
      fuelEconomyUnit: FuelEconomyUnit.KM_POR_GAL,
      tankCapacityL: 50,
      airbagsCount: 7,
      hasAbs: true,
      hasStabilityControl: true,
      hasRearCamera: true,
      seatType: 'Tela',
      hasBluetooth: true,
      hasCarPlay: false,
      warrantyYears: 3,
      warrantyKm: 100000,
      highlights: ['Sensores de parking'],
    },
  };

  it('reproduces the vehicle field by field after persistence + reconstruction', () => {
    const original = Vehicle.create(props);
    const persistence = VehicleMapper.toPersistence(original);

    const fakeRow: VehicleRow = {
      id: 1,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      ...persistence,
    } as unknown as VehicleRow;

    const reconstructed = VehicleMapper.toDomain(fakeRow);

    expect(reconstructed.brand).toBe(original.brand);
    expect(reconstructed.model).toBe(original.model);
    expect(reconstructed.trim).toBe(original.trim);
    expect(reconstructed.year).toBe(original.year);
    expect(reconstructed.price.amount).toBe(original.price.amount);
    expect(reconstructed.price.includes).toBe(original.price.includes);
    expect(reconstructed.mainImageUrl).toBe(original.mainImageUrl);
    expect(reconstructed.category).toBe(original.category);
    expect(reconstructed.specs).toEqual(original.specs);
    expect(reconstructed.fuelEconomyNormalizedKmPerL).toBeCloseTo(
      original.fuelEconomyNormalizedKmPerL as number,
      2,
    );
    expect(reconstructed.isPublished).toBe(original.isPublished);
  });
});
