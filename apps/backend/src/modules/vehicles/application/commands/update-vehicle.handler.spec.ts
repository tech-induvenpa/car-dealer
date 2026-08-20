import { Brand, VehicleCategory, DriveType, FuelType, TransmissionType } from '../../domain/vehicle-enums';
import { CreateVehicleProps, Vehicle } from '../../domain/vehicle.aggregate';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VehicleRepository } from '../../domain/ports/vehicle.repository';
import { UpdateVehicleCommand } from './update-vehicle.command';
import { UpdateVehicleHandler } from './update-vehicle.handler';

function props(): CreateVehicleProps {
  return {
    brand: Brand.CHANGAN,
    model: 'CS35 Plus',
    trim: 'Premium AWD',
    year: 2024,
    price: 24000,
    priceIncludes: null,
    mainImageUrl: 'https://example.com/cs35.jpg',
    category: VehicleCategory.SUV,
    specs: {
      displacementCc: null,
      cylinders: null,
      horsepowerHp: null,
      torqueNm: null,
      fuelType: FuelType.GASOLINA,
      transmissionType: TransmissionType.CVT,
      transmissionSpeeds: null,
      driveType: DriveType.AWD_4X4,
      lengthMm: null,
      widthMm: null,
      heightMm: null,
      wheelbaseMm: null,
      trunkCapacityL: null,
      weightKg: null,
      passengerCapacity: null,
      fuelEconomyValue: null,
      fuelEconomyUnit: null,
      tankCapacityL: null,
      airbagsCount: null,
      hasAbs: true,
      hasStabilityControl: true,
      hasRearCamera: true,
      seatType: null,
      hasBluetooth: true,
      hasCarPlay: true,
      warrantyYears: null,
      warrantyKm: null,
      highlights: [],
    },
  };
}

describe('UpdateVehicleHandler', () => {
  it('throws VehicleNotFoundException and never saves when the id does not exist', async () => {
    const repository: jest.Mocked<VehicleRepository> = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      findAllPublished: jest.fn(),
    };
    const handler = new UpdateVehicleHandler(repository);

    await expect(handler.execute(new UpdateVehicleCommand(999, props()))).rejects.toThrow(
      VehicleNotFoundException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('updates and saves the vehicle when found', async () => {
    const existing = Vehicle.reconstruct({
      ...props(),
      id: 1,
      fuelEconomyNormalizedKmPerL: null,
      isPublished: true,
    });
    const repository: jest.Mocked<VehicleRepository> = {
      findById: jest.fn().mockResolvedValue(existing),
      save: jest.fn().mockResolvedValue(1),
      findAllPublished: jest.fn(),
    };
    const handler = new UpdateVehicleHandler(repository);

    await handler.execute(new UpdateVehicleCommand(1, { ...props(), model: 'CS35 Plus Facelift' }));

    expect(repository.save).toHaveBeenCalledWith(existing);
    expect(existing.model).toBe('CS35 Plus Facelift');
  });
});
