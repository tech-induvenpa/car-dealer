import { GetVehicleByIdHandler } from './get-vehicle-by-id.handler';
import { GetVehicleByIdQuery } from './get-vehicle-by-id.query';

describe('GetVehicleByIdHandler', () => {
  it('returns null when the vehicle does not exist', async () => {
    const prisma = { vehicle: { findUnique: jest.fn().mockResolvedValue(null) } } as any;
    const handler = new GetVehicleByIdHandler(prisma);

    const result = await handler.execute(new GetVehicleByIdQuery(999));

    expect(result).toBeNull();
  });

  it('returns the vehicle even when archived (no isPublished filter)', async () => {
    const row = {
      id: 1,
      isPublished: false,
      price: { toString: () => '1000' },
      fuelEconomyValue: null,
      fuelEconomyNormalizedKmPerL: null,
    };
    const prisma = { vehicle: { findUnique: jest.fn().mockResolvedValue(row) } } as any;
    const handler = new GetVehicleByIdHandler(prisma);

    const result = await handler.execute(new GetVehicleByIdQuery(1));

    expect(result?.isPublished).toBe(false);
    expect(result?.price).toBe(1000);
  });
});
