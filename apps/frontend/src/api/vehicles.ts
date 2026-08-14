import { api } from './client'
import type { ComparisonResult, Vehicle, VehicleFilters, VehicleFormInput } from '../types/vehicle'

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

// admin — todos requieren sesión (Authorization header lo agrega api/client.ts)
export function createVehicle(input: VehicleFormInput): Promise<{ id: number }> {
  return api.post<{ id: number }>('/vehicles', input)
}

export function updateVehicle(id: number, input: VehicleFormInput): Promise<void> {
  return api.patch<void>(`/vehicles/${id}`, input)
}

export function archiveVehicle(id: number): Promise<void> {
  return api.post<void>(`/vehicles/${id}/archive`)
}

export function publishVehicle(id: number): Promise<void> {
  return api.post<void>(`/vehicles/${id}/publish`)
}
