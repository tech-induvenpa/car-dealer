import { Brand, VehicleCategory } from '../../domain/vehicle-enums';

export interface ListVehiclesFilters {
  brand?: Brand;
  category?: VehicleCategory;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  includeUnpublished: boolean;
}

export class ListVehiclesQuery {
  constructor(public readonly filters: ListVehiclesFilters) {}
}
