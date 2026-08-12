import { ListVehiclesHandler } from './list-vehicles.handler';
import { ListVehiclesQuery } from './list-vehicles.query';

describe('ListVehiclesHandler', () => {
  function mockPrisma(rows: unknown[] = []) {
    const findMany = jest.fn().mockResolvedValue(rows);
    return { prisma: { vehicle: { findMany } } as any, findMany };
  }

  it('filters to isPublished=true by default', async () => {
    const { prisma, findMany } = mockPrisma();
    const handler = new ListVehiclesHandler(prisma);

    await handler.execute(new ListVehiclesQuery({ includeUnpublished: false }));

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ isPublished: true }) }),
    );
  });

  it('omits the isPublished filter when includeUnpublished is true', async () => {
    const { prisma, findMany } = mockPrisma();
    const handler = new ListVehiclesHandler(prisma);

    await handler.execute(new ListVehiclesQuery({ includeUnpublished: true }));

    const where = findMany.mock.calls[0][0].where;
    expect(where.isPublished).toBeUndefined();
  });

  it('converts Decimal price fields to numbers', async () => {
    const { prisma } = mockPrisma([
      { id: 1, price: { toString: () => '24000' }, fuelEconomyValue: null, fuelEconomyNormalizedKmPerL: null },
    ]);
    const handler = new ListVehiclesHandler(prisma);

    const result = await handler.execute(new ListVehiclesQuery({ includeUnpublished: false }));

    expect(result[0].price).toBe(24000);
    expect(typeof result[0].price).toBe('number');
  });
});
