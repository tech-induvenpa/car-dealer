export type Brand = 'TOYOTA' | 'KIA' | 'CHANGAN'

export type VehicleCategory = 'SUV' | 'SEDAN' | 'PICKUP' | 'HATCHBACK' | 'COMPACTO'

export type FuelType = 'GASOLINA' | 'DIESEL' | 'HIBRIDO' | 'ELECTRICO'

export type TransmissionType = 'MANUAL' | 'AUTOMATICA' | 'CVT' | 'DCT'

export type DriveType = 'FWD_4X2' | 'AWD_4X4'

export type FuelEconomyUnit = 'KM_POR_GAL' | 'L_POR_100KM'

// Espejo de VehicleReadDto (apps/backend/.../vehicle-read.mapper.ts) — sin
// paquete compartido (ver ADR-0001), se duplica a propósito.
export interface Vehicle {
  id: number
  brand: Brand
  model: string
  trim: string
  year: number
  price: number
  priceIncludes: string | null
  mainImageUrl: string
  category: VehicleCategory
  displacementCc: number | null
  cylinders: number | null
  horsepowerHp: number | null
  torqueNm: number | null
  fuelType: FuelType
  transmissionType: TransmissionType
  transmissionSpeeds: number | null
  driveType: DriveType
  lengthMm: number | null
  widthMm: number | null
  heightMm: number | null
  wheelbaseMm: number | null
  trunkCapacityL: number | null
  weightKg: number | null
  passengerCapacity: number | null
  fuelEconomyValue: number | null
  fuelEconomyUnit: FuelEconomyUnit | null
  fuelEconomyNormalizedKmPerL: number | null
  tankCapacityL: number | null
  airbagsCount: number | null
  hasAbs: boolean
  hasStabilityControl: boolean
  hasRearCamera: boolean
  seatType: string | null
  hasBluetooth: boolean
  hasCarPlay: boolean
  warrantyYears: number | null
  warrantyKm: number | null
  highlights: string[]
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface VehicleFilters {
  brand?: Brand
  category?: VehicleCategory
  search?: string
  minPrice?: number
  maxPrice?: number
}

export interface ComparisonResult {
  categoryMismatch: boolean
  winners: Record<string, number[]>
  vehicles: Vehicle[]
}
