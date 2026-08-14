import { api } from './client'
import type { ComparisonResult, Vehicle, VehicleFilters } from '../types/vehicle'

export function listVehicles(filters: VehicleFilters = {}): Promise<Vehicle[]> {
  const params = new URLSearchParams()
  if (filters.brand) params.set('brand', filters.brand)
  if (filters.category) params.set('category', filters.category)
  if (filters.search) params.set('search', filters.search)
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice))
  const query = params.toString()
  return api.get<Vehicle[]>(`/vehicles${query ? `?${query}` : ''}`)
}

export function getVehicle(id: number): Promise<Vehicle> {
  return api.get<Vehicle>(`/vehicles/${id}`)
}

export function compareVehicles(ids: number[]): Promise<ComparisonResult> {
  return api.get<ComparisonResult>(`/vehicles/compare?ids=${ids.join(',')}`)
}
