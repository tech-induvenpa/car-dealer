import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getVehicle } from '../../api/vehicles'
import { trackEvent } from '../../api/analytics'
import type { Vehicle } from '../../types/vehicle'
import { useComparison } from '../../context/ComparisonContext'

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function Spec({ label, value }: { label: string; value: string | number | null }) {
  if (value == null) return null
  return (
    <div className="flex justify-between border-b border-neutral-100 py-2 text-sm">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [notFound, setNotFound] = useState(false)
  const { vehicleIds, addVehicle, removeVehicle, isFull } = useComparison()

  useEffect(() => {
    if (!id) return
    setVehicle(null)
    setNotFound(false)
    getVehicle(Number(id))
      .then((v) => {
        setVehicle(v)
        trackEvent({ type: 'VEHICLE_VIEWED', vehicleId: v.id })
      })
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-neutral-500">No encontramos ese vehículo.</p>
        <Link to="/" className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  if (!vehicle) {
    return <p className="py-12 text-center text-neutral-500">Cargando...</p>
  }

  const inComparison = vehicleIds.includes(vehicle.id)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-1/2">
        <img
          src={vehicle.mainImageUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="aspect-video w-full rounded-xl object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
            {vehicle.category}
          </span>
          <h1 className="mt-2 text-2xl font-semibold">
            {vehicle.brand} {vehicle.model} {vehicle.trim}
          </h1>
          <p className="text-neutral-500">{vehicle.year}</p>
        </div>

        <div>
          <p className="text-2xl font-bold">{formatPrice(vehicle.price)}</p>
          {vehicle.priceIncludes ? (
            <p className="text-sm text-neutral-500">Incluye: {vehicle.priceIncludes}</p>
          ) : null}
        </div>

        <button
          type="button"
          disabled={!inComparison && isFull}
          onClick={() => (inComparison ? removeVehicle(vehicle.id) : addVehicle(vehicle.id))}
          className={`w-fit rounded-lg px-4 py-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            inComparison
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {inComparison ? 'Quitar de comparación' : 'Agregar a comparación'}
        </button>

        {vehicle.highlights.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vehicle.highlights.map((h) => (
              <span
                key={h}
                className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700"
              >
                {h}
              </span>
            ))}
          </div>
        ) : null}

        <hr className="border-neutral-200" />

        <div>
          <h2 className="mb-2 font-medium">Motor y desempeño</h2>
          <Spec label="Cilindrada" value={vehicle.displacementCc ? `${vehicle.displacementCc} cc` : null} />
          <Spec label="Cilindros" value={vehicle.cylinders} />
          <Spec label="Potencia" value={vehicle.horsepowerHp ? `${vehicle.horsepowerHp} hp` : null} />
          <Spec label="Torque" value={vehicle.torqueNm ? `${vehicle.torqueNm} Nm` : null} />
          <Spec label="Combustible" value={vehicle.fuelType} />
          <Spec label="Transmisión" value={vehicle.transmissionType} />
          <Spec label="Tracción" value={vehicle.driveType} />
          <Spec
            label="Consumo"
            value={
              vehicle.fuelEconomyValue && vehicle.fuelEconomyUnit
                ? `${vehicle.fuelEconomyValue} ${vehicle.fuelEconomyUnit === 'KM_POR_GAL' ? 'km/gal' : 'L/100km'}`
                : null
            }
          />
        </div>

        <div>
          <h2 className="mb-2 font-medium">Dimensiones y capacidad</h2>
          <Spec label="Baúl" value={vehicle.trunkCapacityL ? `${vehicle.trunkCapacityL} L` : null} />
          <Spec label="Pasajeros" value={vehicle.passengerCapacity} />
          <Spec label="Peso" value={vehicle.weightKg ? `${vehicle.weightKg} kg` : null} />
        </div>

        <div>
          <h2 className="mb-2 font-medium">Seguridad y confort</h2>
          <Spec label="Airbags" value={vehicle.airbagsCount} />
          <Spec label="ABS" value={vehicle.hasAbs ? 'Sí' : 'No'} />
          <Spec label="Control de estabilidad" value={vehicle.hasStabilityControl ? 'Sí' : 'No'} />
          <Spec label="Cámara de reversa" value={vehicle.hasRearCamera ? 'Sí' : 'No'} />
          <Spec label="Bluetooth" value={vehicle.hasBluetooth ? 'Sí' : 'No'} />
          <Spec label="CarPlay/Android Auto" value={vehicle.hasCarPlay ? 'Sí' : 'No'} />
        </div>

        {vehicle.warrantyYears ? (
          <Spec
            label="Garantía"
            value={`${vehicle.warrantyYears} años${vehicle.warrantyKm ? ` / ${vehicle.warrantyKm.toLocaleString()} km` : ''}`}
          />
        ) : null}
      </div>
    </div>
  )
}
