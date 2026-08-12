import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  toVehicleReadDto,
  VehicleReadDto,
} from '../../infrastructure/persistence/vehicle-read.mapper';
import { GetVehicleByIdQuery } from './get-vehicle-by-id.query';

// ponytail: devuelve el vehículo exista publicado o archivado — la política de
// "ocultar archivados al público" vive en el controller, no acá, para que el
// admin reuse la misma Query sin duplicarla.
@QueryHandler(GetVehicleByIdQuery)
export class GetVehicleByIdHandler implements IQueryHandler<GetVehicleByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetVehicleByIdQuery): Promise<VehicleReadDto | null> {
    const row = await this.prisma.vehicle.findUnique({ where: { id: query.id } });
    return row ? toVehicleReadDto(row) : null;
  }
}
