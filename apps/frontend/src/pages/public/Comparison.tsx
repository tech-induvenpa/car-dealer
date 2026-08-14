import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { compareVehicles } from '../../api/vehicles'
import { trackEvent } from '../../api/analytics'
import type { ComparisonResult, Vehicle } from '../../types/vehicle'
import { useComparison } from '../../context/ComparisonContext'
import { LeadForm } from '../../components/lead/LeadForm'

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

interface Row {
  label: string
  field: string
  format: (v: Vehicle) => string
}

const ROWS: Row[] = [
  { label: 'Precio', field: 'price', format: (v) => formatPrice(v.price) },
  { label: 'Año', field: 'year', format: (v) => String(v.year) },
  { label: 'Potencia', field: 'horsepowerHp', format: (v) => (v.horsepowerHp ? `${v.horsepowerHp} hp` : '—') },
  { label: 'Torque', field: 'torqueNm', format: (v) => (v.torqueNm ? `${v.torqueNm} Nm` : '—') },
  { label: 'Transmisión', field: 'transmissionType', format: (v) => v.transmissionType },
  { label: 'Tracción', field: 'driveType', format: (v) => v.driveType },
  {
    label: 'Consumo',
    field: 'fuelEconomyNormalizedKmPerL',
    format: (v) => (v.fuelEconomyNormalizedKmPerL ? `${v.fuelEconomyNormalizedKmPerL.toFixed(1)} km/L` : '—'),
  },
  { label: 'Baúl', field: 'trunkCapacityL', format: (v) => (v.trunkCapacityL ? `${v.trunkCapacityL} L` : '—') },
  { label: 'Peso', field: 'weightKg', format: (v) => (v.weightKg ? `${v.weightKg} kg` : '—') },
  { label: 'Airbags', field: 'airbagsCount', format: (v) => (v.airbagsCount ? String(v.airbagsCount) : '—') },
  { label: 'ABS', field: 'hasAbs', format: (v) => (v.hasAbs ? 'Sí' : 'No') },
  { label: 'Control de estabilidad', field: 'hasStabilityControl', format: (v) => (v.hasStabilityControl ? 'Sí' : 'No') },
  { label: 'Cámara de reversa', field: 'hasRearCamera', format: (v) => (v.hasRearCamera ? 'Sí' : 'No') },
  { label: 'Bluetooth', field: 'hasBluetooth', format: (v) => (v.hasBluetooth ? 'Sí' : 'No') },
  { label: 'CarPlay / Android Auto', field: 'hasCarPlay', format: (v) => (v.hasCarPlay ? 'Sí' : 'No') },
  { label: 'Garantía', field: 'warrantyYears', format: (v) => (v.warrantyYears ? `${v.warrantyYears} años` : '—') },
]

export function Comparison() {
  const [searchParams] = useSearchParams()
  const { vehicleIds: trayIds, clear } = useComparison()

  const ids = useMemo(() => {
    const fromQuery = searchParams.get('ids')
    if (fromQuery) return fromQuery.split(',').map(Number).filter(Boolean)
    return trayIds
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (ids.length < 2) return
    setResult(null)
    setError(false)
    compareVehicles(ids)
      .then((res) => {
        setResult(res)
        trackEvent({ type: 'COMPARISON_PERFORMED', vehicleIds: ids })
      })
      .catch(() => setError(true))
  }, [ids])

  if (ids.length < 2) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-neutral-500">
          Elegí al menos 2 vehículos desde el catálogo para compararlos.
        </p>
        <Link to="/" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Ir al catálogo
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-600">No pudimos armar la comparación.</p>
  }

  if (!result) {
    return <p className="py-12 text-center text-neutral-500">Cargando...</p>
  }

  return (
    <div className="flex flex-col gap-6">
      {result.categoryMismatch ? (
        <div className="rounded-lg bg-amber-50 p-4 text-amber-700">
          Estás comparando vehículos de categorías bastante distintas — la comparación puede no
          ser del todo justa.
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse">
          <thead>
            <tr>
              <th className="w-40" />
              {result.vehicles.map((v) => (
                <th key={v.id} className="p-3 text-left align-top">
                  <img
                    src={v.mainImageUrl}
                    alt={`${v.brand} ${v.model}`}
                    className="mb-2 aspect-video w-full rounded-lg object-cover"
                  />
                  <p className="font-medium leading-tight">
                    {v.brand} {v.model} {v.trim}
                  </p>
                  <span className="mt-1 inline-block rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                    {v.category}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.field} className="border-t border-neutral-100">
                <td className="p-3 text-sm text-neutral-500">{row.label}</td>
                {result.vehicles.map((v) => {
                  const isWinner = result.winners[row.field]?.includes(v.id)
                  return (
                    <td
                      key={v.id}
                      className={`p-3 text-sm ${isWinner ? 'font-semibold text-green-600' : ''}`}
                    >
                      {row.format(v)}
                      {isWinner ? ' ★' : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <LeadForm vehicleIds={result.vehicles.map((v) => v.id)} />

      <button
        type="button"
        onClick={clear}
        className="self-start text-sm text-neutral-500 underline hover:text-neutral-900"
      >
        Limpiar comparación
      </button>
    </div>
  )
}
