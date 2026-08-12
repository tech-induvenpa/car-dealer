import { InvalidComparisonSizeException } from '../../domain/exceptions/invalid-comparison-size.exception';
import { CompareVehiclesByIdHandler } from './compare-vehicles-by-id.handler';
import { CompareVehiclesByIdQuery } from './compare-vehicles-by-id.query';

function row(id: number, overrides: Record<string, unknown> = {}) {
  return {
    id,
    category: 'SUV',
    price: { toString: () => '20000' },
    horsepowerHp: 150,
    torqueNm: 200,
    warrantyYears: 3,
    warrantyKm: 100000,
    trunkCapacityL: 500,
    airbagsCount: 6,
    fuelEconomyValue: null,
    fuelEconomyNormalizedKmPerL: null,
    hasAbs: true,
    hasStabilityControl: true,
    hasRearCamera: true,
    hasBluetooth: true,
    hasCarPlay: true,
    isPublished: true,
    ...overrides,
  };
}

describe('CompareVehiclesByIdHandler', () => {
  it('rejects fewer than 2 ids without touching the database', async () => {
    const findMany = jest.fn();
    const handler = new CompareVehiclesByIdHandler({ vehicle: { findMany } } as any);

    await expect(handler.execute(new CompareVehiclesByIdQuery([1]))).rejects.toThrow(
      InvalidComparisonSizeException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects more than 4 ids without touching the database', async () => {
    const findMany = jest.fn();
    const handler = new CompareVehiclesByIdHandler({ vehicle: { findMany } } as any);

    await expect(handler.execute(new CompareVehiclesByIdQuery([1, 2, 3, 4, 5]))).rejects.toThrow(
      InvalidComparisonSizeException,
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it('preserves the requested order and silently drops archived/missing ids', async () => {
    const findMany = jest.fn().mockResolvedValue([row(3), row(1)]);
    const handler = new CompareVehiclesByIdHandler({ vehicle: { findMany } } as any);

    const result = await handler.execute(new CompareVehiclesByIdQuery([1, 2, 3]));

    expect(result.vehicles.map((v) => v.id)).toEqual([1, 3]);
  });
});
