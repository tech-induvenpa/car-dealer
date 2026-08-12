import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  toVehicleReadDto,
  VehicleReadDto,
} from '../../infrastructure/persistence/vehicle-read.mapper';
import { ListVehiclesQuery } from './list-vehicles.query';

@QueryHandler(ListVehiclesQuery)
export class ListVehiclesHandler implements IQueryHandler<ListVehiclesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListVehiclesQuery): Promise<VehicleReadDto[]> {
    const { brand, category, search, minPrice, maxPrice, includeUnpublished } = query.filters;

    const where: Prisma.VehicleWhereInput = {
      ...(includeUnpublished ? {} : { isPublished: true }),
      ...(brand ? { brand: brand as unknown as Prisma.VehicleWhereInput['brand'] } : {}),
      ...(category
        ? { category: category as unknown as Prisma.VehicleWhereInput['category'] }
        : {}),
      ...(search
        ? {
            OR: [
              { model: { contains: search, mode: 'insensitive' as const } },
              { trim: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(minPrice != null || maxPrice != null
        ? { price: { gte: minPrice ?? undefined, lte: maxPrice ?? undefined } }
        : {}),
    };

    const rows = await this.prisma.vehicle.findMany({ where, orderBy: { id: 'asc' } });
    return rows.map(toVehicleReadDto);
  }
}
