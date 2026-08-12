import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { VehicleNotFoundException } from '../../domain/exceptions/vehicle-not-found.exception';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../domain/ports/vehicle.repository';
import { PublishVehicleCommand } from './publish-vehicle.command';

@CommandHandler(PublishVehicleCommand)
export class PublishVehicleHandler implements ICommandHandler<PublishVehicleCommand> {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly repository: VehicleRepository,
  ) {}

  async execute(command: PublishVehicleCommand): Promise<void> {
    const vehicle = await this.repository.findById(command.id);
    if (!vehicle) {
      throw new VehicleNotFoundException(command.id);
    }
    vehicle.publish();
    await this.repository.save(vehicle);
  }
}
