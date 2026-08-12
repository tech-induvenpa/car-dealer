import { CreateVehicleProps } from '../../domain/vehicle.aggregate';

export class CreateVehicleCommand {
  constructor(public readonly props: CreateVehicleProps) {}
}
