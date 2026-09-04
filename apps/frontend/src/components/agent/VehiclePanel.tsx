import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@heroui/react'
import { getVehicle } from '../../api/vehicles'
import type { Vehicle } from '../../types/vehicle'
import { SpecCard } from '../vehicle/SpecCard'
import { FuelIcon, ShieldIcon, TrunkIcon } from '../icons'

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// Panel derecho del chat: 1 vehículo -> detalle resumido, 2+ -> grid liviano
// (la comparación spec-por-spec completa sigue viviendo en /comparar).
export function VehiclePanel({
  vehicleIds,
  onSelectSingle,
}: {
  vehicleIds: number[]
  onSelectSingle: (vehicleId: number) => void
}) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(vehicleIds.map((id) => getVehicle(id)))
      .then((result) => {
        if (!cancelled) setVehicles(result)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // ponytail: join como key estable — vehicleIds cambia de identidad en cada render del padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleIds.join(',')])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted">
        <Spinner /> Cargando...
      </div>
    )
  }

  if (vehicles.length === 1) {
    const vehicle = vehicles[0]
    return (
      <div className="flex flex-col gap-4">
        <img
          src={vehicle.mainImageUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="aspect-video w-full rounded-2xl object-cover"
        />
        <div>
          <p className="text-xs font-semibold tracking-wide text-accent uppercase">{vehicle.category}</p>
          <h2 className="mt-1 text-xl font-bold text-foreground">
            {vehicle.brand} {vehicle.model} {vehicle.trim}
          </h2>
          <p className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">{formatPrice(vehicle.price)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {vehicle.fuelEconomyNormalizedKmPerL ? (
            <SpecCard
              icon={<FuelIcon className="h-5 w-5" />}
              label="Consumo"
              value={`${vehicle.fuelEconomyNormalizedKmPerL.toFixed(1)} km/L`}
            />
          ) : null}
          {vehicle.trunkCapacityL ? (
            <SpecCard icon={<TrunkIcon className="h-5 w-5" />} label="Maletero" value={`${vehicle.trunkCapacityL} L`} />
          ) : null}
          {vehicle.airbagsCount ? (
            <SpecCard
              icon={<ShieldIcon className="h-5 w-5" />}
              label="Seguridad"
              value={`${vehicle.airbagsCount} airbags`}
            />
          ) : null}
        </div>

        <Link to={`/vehiculos/${vehicle.id}`} className="text-center text-sm text-accent hover:underline">
          Ver ficha completa
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-semibold text-foreground">Vehículos recomendados</h2>
      <div className="flex flex-col gap-3">
        {vehicles.map((vehicle) => (
          <div key={vehicle.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
            <img
              src={vehicle.mainImageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-16 w-24 shrink-0 rounded-lg object-cover"
            />
            <div className="flex flex-1 flex-col gap-0.5">
              <p className="text-sm leading-tight font-medium text-foreground">
                {vehicle.brand} {vehicle.model} {vehicle.trim}
              </p>
              <p className="font-display text-base font-bold tracking-tight text-foreground">{formatPrice(vehicle.price)}</p>
              <button
                type="button"
                onClick={() => onSelectSingle(vehicle.id)}
                className="mt-1 w-fit text-xs font-medium text-accent hover:underline"
              >
                Ver detalle
              </button>
            </div>
          </div>
        ))}
      </div>
      <Link
        to={`/comparar?ids=${vehicles.map((v) => v.id).join(',')}`}
        className="text-center text-sm text-accent hover:underline"
      >
        Ver comparación completa
      </Link>
    </div>
  )
}
