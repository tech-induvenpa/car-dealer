import type { Vehicle } from '../../types/vehicle'

export interface SpecRowDef {
  label: string
  field: string
  format: (v: Vehicle) => string
}

export function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// Una sola definición de las filas de ficha técnica, compartida por la vista
// de par, la tarjeta de Veredicto y la de reparto — si cada una tuviera la
// suya, las etiquetas y formatos divergirían.
export const SPEC_ROWS: SpecRowDef[] = [
  { label: 'Precio', field: 'price', format: (v) => formatPrice(v.price) },
  { label: 'Año', field: 'year', format: (v) => String(v.year) },
  { label: 'Potencia', field: 'horsepowerHp', format: (v) => (v.horsepowerHp ? `${v.horsepowerHp} hp` : '—') },
  { label: 'Torque', field: 'torqueNm', format: (v) => (v.torqueNm ? `${v.torqueNm} Nm` : '—') },
  { label: 'Transmisión', field: 'transmissionType', format: (v) => v.transmissionType },
  { label: 'Tracción', field: 'driveType', format: (v) => v.driveType },
  {
    label: 'Consumo combinado',
    field: 'fuelEconomyNormalizedKmPerL',
    format: (v) => (v.fuelEconomyNormalizedKmPerL ? `${v.fuelEconomyNormalizedKmPerL.toFixed(1)} km/L` : '—'),
  },
  { label: 'Maletero', field: 'trunkCapacityL', format: (v) => (v.trunkCapacityL ? `${v.trunkCapacityL} L` : '—') },
  { label: 'Peso', field: 'weightKg', format: (v) => (v.weightKg ? `${v.weightKg} kg` : '—') },
  { label: 'Airbags', field: 'airbagsCount', format: (v) => (v.airbagsCount ? String(v.airbagsCount) : '—') },
  { label: 'ABS', field: 'hasAbs', format: (v) => (v.hasAbs ? 'Sí' : 'No') },
  { label: 'Control de estabilidad', field: 'hasStabilityControl', format: (v) => (v.hasStabilityControl ? 'Sí' : 'No') },
  { label: 'Cámara de reversa', field: 'hasRearCamera', format: (v) => (v.hasRearCamera ? 'Sí' : 'No') },
  { label: 'Bluetooth', field: 'hasBluetooth', format: (v) => (v.hasBluetooth ? 'Sí' : 'No') },
  { label: 'CarPlay / Android Auto', field: 'hasCarPlay', format: (v) => (v.hasCarPlay ? 'Sí' : 'No') },
  { label: 'Garantía', field: 'warrantyYears', format: (v) => (v.warrantyYears ? `${v.warrantyYears} años` : '—') },
]

export const SPEC_ROW_BY_FIELD: Record<string, SpecRowDef> = Object.fromEntries(
  SPEC_ROWS.map((row) => [row.field, row]),
)
