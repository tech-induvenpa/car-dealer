import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../domain/ports/vehicle.repository';
import { ArchiveVehicleCommand } from './archive-vehicle.command';

@CommandHandler(ArchiveVehicleCommand)
export class ArchiveVehicleHandler implements ICommandHandler<ArchiveVehicleCommand> {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly repository: VehicleRepository,
  ) {}

  async execute(command: ArchiveVehicleCommand): Promise<void> {
    const vehicle = await this.repository.findById(command.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(command.id);
    }
    vehicle.archive();
    await this.repository.save(vehicle);
  }
}
