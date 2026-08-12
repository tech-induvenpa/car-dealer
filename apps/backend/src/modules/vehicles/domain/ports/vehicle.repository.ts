import { Vehicle } from '../vehicle.aggregate';

export const VEHICLE_REPOSITORY = Symbol('VehicleRepository');

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<number>;
  findById(id: number): Promise<Vehicle | null>;
}
