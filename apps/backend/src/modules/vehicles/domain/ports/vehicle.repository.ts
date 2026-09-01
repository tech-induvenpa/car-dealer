import { Vehicle } from '../vehicle.aggregate';

export const VEHICLE_REPOSITORY = Symbol('VehicleRepository');

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<number>;
  findById(id: number): Promise<Vehicle | null>;
  // agregado para CEB-42: el Agente necesita candidatos reales del catálogo
  // para no alucinar vehículos — ver agent/infrastructure/llm.
  findAllPublished(): Promise<Vehicle[]>;
}
