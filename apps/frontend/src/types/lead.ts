export type LeadStatus = 'NUEVO' | 'CONTACTADO' | 'CONVERTIDO' | 'DESCARTADO'

export interface Lead {
  id: number
  firstName: string
  lastName: string
  phone: string
  vehicleIds: number[]
  status: LeadStatus
  createdAt: string
  updatedAt: string
}
