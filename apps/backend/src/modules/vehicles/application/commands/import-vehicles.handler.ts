import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../domain/ports/vehicle.repository';
import { Vehicle } from '../../domain/vehicle.aggregate';
import { CreateVehicleDto } from '../../infrastructure/dto/create-vehicle.dto';
import { toVehicleProps } from '../../infrastructure/persistence/vehicle-write.mapper';
import { ImportVehiclesCommand } from './import-vehicles.command';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportVehiclesResult {
  inserted: number;
  errors: ImportRowError[];
}

// ponytail: reusa exactamente la misma validación del alta individual
// (CreateVehicleDto + Vehicle.create) fila por fila — una fila inválida
// se reporta y se sigue con las demás, nunca aborta el lote.
@CommandHandler(ImportVehiclesCommand)
export class ImportVehiclesHandler implements ICommandHandler<ImportVehiclesCommand> {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly repository: VehicleRepository,
  ) {}

  async execute(command: ImportVehiclesCommand): Promise<ImportVehiclesResult> {
    const errors: ImportRowError[] = [];
    let inserted = 0;

    for (const [index, raw] of command.rows.entries()) {
      const row = index + 1;
      try {
        const dto = plainToInstance(CreateVehicleDto, raw);
        const violations = await validate(dto);
        if (violations.length > 0) {
          const message = violations
            .map((v) => Object.values(v.constraints ?? {}).join(', '))
            .join('; ');
          errors.push({ row, message });
          continue;
        }

        const vehicle = Vehicle.create(toVehicleProps(dto));
        await this.repository.save(vehicle);
        inserted++;
      } catch (err) {
        errors.push({ row, message: err instanceof Error ? err.message : 'Error desconocido' });
      }
    }

    return { inserted, errors };
  }
}
