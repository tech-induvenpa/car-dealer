import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Vehicle } from '../../domain/vehicle.aggregate';
import { VEHICLE_REPOSITORY, VehicleRepository } from '../../domain/ports/vehicle.repository';
import { CreateVehicleCommand } from './create-vehicle.command';

@CommandHandler(CreateVehicleCommand)
export class CreateVehicleHandler implements ICommandHandler<CreateVehicleCommand> {
  constructor(
    @Inject(VEHICLE_REPOSITORY) private readonly repository: VehicleRepository,
  ) {}

  async execute(command: CreateVehicleCommand): Promise<number> {
    const vehicle = Vehicle.create(command.props);
    return this.repository.save(vehicle);
  }
}
