import { api } from './client'

export interface CreateLeadPayload {
  firstName: string
  lastName: string
  phone: string
  vehicleIds: number[]
}

export function createLead(payload: CreateLeadPayload): Promise<{ id: number }> {
  return api.post<{ id: number }>('/leads', payload)
}
