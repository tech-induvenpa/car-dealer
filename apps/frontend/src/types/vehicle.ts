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

// Espejo de CreateVehicleDto/UpdateVehicleDto (apps/backend/.../dto/) — shape
// de escritura, distinta de Vehicle (lectura, plana). POST y PATCH usan la
// misma forma (reemplazo completo, ver ADR de Vehicles Slice 2).
export interface VehicleFormInput {
  brand: Brand
  model: string
  trim: string
  year: number
  price: number
  priceIncludes: string
  mainImageUrl: string
  category: VehicleCategory
  specs: {
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
    tankCapacityL: number | null
    airbagsCount: number | null
    hasAbs: boolean
    hasStabilityControl: boolean
    hasRearCamera: boolean
    seatType: string
    hasBluetooth: boolean
    hasCarPlay: boolean
    warrantyYears: number | null
    warrantyKm: number | null
    highlights: string[]
  }
}

export function emptyVehicleForm(): VehicleFormInput {
  return {
    brand: 'TOYOTA',
    model: '',
    trim: '',
    year: new Date().getFullYear(),
    price: 0,
    priceIncludes: '',
    mainImageUrl: '',
    category: 'SUV',
    specs: {
      displacementCc: null,
      cylinders: null,
      horsepowerHp: null,
      torqueNm: null,
      fuelType: 'GASOLINA',
      transmissionType: 'MANUAL',
      transmissionSpeeds: null,
      driveType: 'FWD_4X2',
      lengthMm: null,
      widthMm: null,
      heightMm: null,
      wheelbaseMm: null,
      trunkCapacityL: null,
      weightKg: null,
      passengerCapacity: null,
      fuelEconomyValue: null,
      fuelEconomyUnit: null,
      tankCapacityL: null,
      airbagsCount: null,
      hasAbs: false,
      hasStabilityControl: false,
      hasRearCamera: false,
      seatType: '',
      hasBluetooth: false,
      hasCarPlay: false,
      warrantyYears: null,
      warrantyKm: null,
      highlights: [],
    },
  }
}

export function vehicleToFormInput(v: Vehicle): VehicleFormInput {
  return {
    brand: v.brand,
    model: v.model,
    trim: v.trim,
    year: v.year,
    price: v.price,
    priceIncludes: v.priceIncludes ?? '',
    mainImageUrl: v.mainImageUrl,
    category: v.category,
    specs: {
      displacementCc: v.displacementCc,
      cylinders: v.cylinders,
      horsepowerHp: v.horsepowerHp,
      torqueNm: v.torqueNm,
      fuelType: v.fuelType,
      transmissionType: v.transmissionType,
      transmissionSpeeds: v.transmissionSpeeds,
      driveType: v.driveType,
      lengthMm: v.lengthMm,
      widthMm: v.widthMm,
      heightMm: v.heightMm,
      wheelbaseMm: v.wheelbaseMm,
      trunkCapacityL: v.trunkCapacityL,
      weightKg: v.weightKg,
      passengerCapacity: v.passengerCapacity,
      fuelEconomyValue: v.fuelEconomyValue,
      fuelEconomyUnit: v.fuelEconomyUnit,
      tankCapacityL: v.tankCapacityL,
      airbagsCount: v.airbagsCount,
      hasAbs: v.hasAbs,
      hasStabilityControl: v.hasStabilityControl,
      hasRearCamera: v.hasRearCamera,
      seatType: v.seatType ?? '',
      hasBluetooth: v.hasBluetooth,
      hasCarPlay: v.hasCarPlay,
      warrantyYears: v.warrantyYears,
      warrantyKm: v.warrantyKm,
      highlights: v.highlights,
    },
  }
}
