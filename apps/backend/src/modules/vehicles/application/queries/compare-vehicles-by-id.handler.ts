import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../../prisma/prisma.service';
import { InvalidComparisonSizeException } from '../../domain/exceptions/invalid-comparison-size.exception';
import {
  ComparableVehicle,
  ComparisonResult,
  VehicleComparisonPolicy,
} from '../../domain/vehicle-comparison.policy';
import {
  toVehicleReadDto,
  VehicleReadDto,
} from '../../infrastructure/persistence/vehicle-read.mapper';
import { CompareVehiclesByIdQuery } from './compare-vehicles-by-id.query';

const MIN_COMPARISON_SIZE = 2;
const MAX_COMPARISON_SIZE = 4;

export interface CompareVehiclesResult extends ComparisonResult {
  vehicles: VehicleReadDto[];
}

@QueryHandler(CompareVehiclesByIdQuery)
export class CompareVehiclesByIdHandler implements IQueryHandler<CompareVehiclesByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: CompareVehiclesByIdQuery): Promise<CompareVehiclesResult> {
    if (query.ids.length < MIN_COMPARISON_SIZE || query.ids.length > MAX_COMPARISON_SIZE) {
      throw new InvalidComparisonSizeException(query.ids.length);
    }

    const rows = await this.prisma.vehicle.findMany({
      where: { id: { in: query.ids }, isPublished: true },
    });
    const byId = new Map(rows.map((row) => [row.id, toVehicleReadDto(row)]));
    // conserva el orden pedido; ids archivados/inexistentes se excluyen en silencio
    const vehicles = query.ids
      .map((id) => byId.get(id))
      .filter((v): v is VehicleReadDto => v != null);

    return {
      ...VehicleComparisonPolicy.evaluate(vehicles as unknown as ComparableVehicle[]),
      vehicles,
    };
  }
}
