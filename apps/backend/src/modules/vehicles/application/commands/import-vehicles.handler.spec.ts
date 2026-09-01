import { ImportVehiclesCommand } from './import-vehicles.command';
import { ImportVehiclesHandler } from './import-vehicles.handler';

function validRow(overrides: Record<string, unknown> = {}) {
  return {
    brand: 'CHANGAN',
    model: 'CS35 Plus',
    trim: 'Premium AWD',
    year: 2024,
    price: 24000,
    mainImageUrl: 'https://example.com/cs35.jpg',
    category: 'SUV',
    specs: {
      fuelType: 'GASOLINA',
      transmissionType: 'CVT',
      driveType: 'AWD_4X4',
      hasAbs: true,
      hasStabilityControl: true,
      hasRearCamera: true,
      hasBluetooth: true,
      hasCarPlay: true,
      highlights: [],
    },
    ...overrides,
  };
}

describe('ImportVehiclesHandler', () => {
  it('persists every row of an all-valid batch and reports no errors', async () => {
    const save = jest.fn().mockResolvedValue(1);
    const handler = new ImportVehiclesHandler({ save, findById: jest.fn(), findAllPublished: jest.fn() });

    const result = await handler.execute(
      new ImportVehiclesCommand([validRow(), validRow({ model: 'CS35 Plus 2' })]),
    );

    expect(result.inserted).toBe(2);
    expect(result.errors).toEqual([]);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('persists valid rows and reports invalid ones without aborting the batch', async () => {
    const save = jest.fn().mockResolvedValue(1);
    const handler = new ImportVehiclesHandler({ save, findById: jest.fn(), findAllPublished: jest.fn() });

    const result = await handler.execute(
      new ImportVehiclesCommand([validRow(), validRow({ price: 0 }), validRow({ model: 'ok' })]),
    );

    expect(result.inserted).toBe(2);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].row).toBe(2);
    expect(save).toHaveBeenCalledTimes(2);
  });

  it('reports an out-of-range year as a row error without persisting it', async () => {
    const save = jest.fn().mockResolvedValue(1);
    const handler = new ImportVehiclesHandler({ save, findById: jest.fn(), findAllPublished: jest.fn() });

    const result = await handler.execute(new ImportVehiclesCommand([validRow({ year: 2099 })]));

    expect(result.inserted).toBe(0);
    expect(result.errors).toEqual([{ row: 1, message: expect.stringContaining('2099') }]);
    expect(save).not.toHaveBeenCalled();
  });
});
