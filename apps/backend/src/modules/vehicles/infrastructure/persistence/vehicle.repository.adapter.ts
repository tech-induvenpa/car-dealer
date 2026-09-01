import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Vehicle } from '../../domain/vehicle.aggregate';
import { VehicleRepository } from '../../domain/ports/vehicle.repository';
import { VehicleMapper } from './vehicle.mapper';

@Injectable()
export class VehicleRepositoryAdapter implements VehicleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(vehicle: Vehicle): Promise<number> {
    const data = VehicleMapper.toPersistence(vehicle);
    if (vehicle.id === null) {
      const created = await this.prisma.vehicle.create({ data });
      return created.id;
    }
    const updated = await this.prisma.vehicle.update({
      where: { id: vehicle.id },
      data,
    });
    return updated.id;
  }

  async findById(id: number): Promise<Vehicle | null> {
    const row = await this.prisma.vehicle.findUnique({ where: { id } });
    return row ? VehicleMapper.toDomain(row) : null;
  }

  async findAllPublished(): Promise<Vehicle[]> {
    const rows = await this.prisma.vehicle.findMany({
      where: { isPublished: true },
      orderBy: { id: 'asc' },
    });
    return rows.map(VehicleMapper.toDomain);
  }
}
