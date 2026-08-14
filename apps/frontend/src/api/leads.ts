import { api } from './client'
import type { Lead, LeadStatus } from '../types/lead'

export interface CreateLeadPayload {
  firstName: string
  lastName: string
  phone: string
  vehicleIds: number[]
}

export function createLead(payload: CreateLeadPayload): Promise<{ id: number }> {
  return api.post<{ id: number }>('/leads', payload)
}

// admin — requiere sesión
export function listLeads(): Promise<Lead[]> {
  return api.get<Lead[]>('/leads')
}

export function updateLeadStatus(id: number, status: LeadStatus): Promise<void> {
  return api.patch<void>(`/leads/${id}/status`, { status })
}
