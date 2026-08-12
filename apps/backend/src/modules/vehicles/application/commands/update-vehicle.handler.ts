import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../domain/ports/vehicle.repository';
import { UpdateVehicleCommand } from './update-vehicle.command';

@CommandHandler(UpdateVehicleCommand)
export class UpdateVehicleHandler implements ICommandHandler<UpdateVehicleCommand> {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly repository: VehicleRepository,
  ) {}

  async execute(command: UpdateVehicleCommand): Promise<void> {
    const vehicle = await this.repository.findById(command.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(command.id);
    }
    vehicle.update(command.props);
    await this.repository.save(vehicle);
  }
}
