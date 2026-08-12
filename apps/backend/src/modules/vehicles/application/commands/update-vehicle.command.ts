import { CreateVehicleProps } from '../../domain/vehicle.aggregate';

export class UpdateVehicleCommand {
  constructor(
    public readonly id: number,
    public readonly props: CreateVehicleProps,
  ) {}
}
