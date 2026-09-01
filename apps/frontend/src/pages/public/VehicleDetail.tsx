import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Chip, Spinner, buttonVariants } from '@heroui/react'
import { getVehicle } from '../../api/vehicles'
import { trackEvent } from '../../api/analytics'
import type { FuelType, Vehicle } from '../../types/vehicle'
import { useComparison } from '../../context/ComparisonContext'
import { ArrowLeftIcon, FuelIcon, ShieldIcon, TrunkIcon } from '../../components/icons'
import { SpecCard } from '../../components/vehicle/SpecCard'

const FUEL_LABEL: Record<FuelType, string> = {
  GASOLINA: 'Gasolina',
  DIESEL: 'Diésel',
  HIBRIDO: 'Híbrido',
  ELECTRICO: 'Eléctrico',
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

function Spec({ label, value }: { label: string; value: string | number | null }) {
  if (value == null) return null
  return (
    <div className="flex justify-between border-b border-separator py-2 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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
        <p className="mb-4 text-muted">No encontramos ese vehículo.</p>
        <Link to="/" className={buttonVariants()}>
          Volver al catálogo
        </Link>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted">
        <Spinner /> Cargando...
      </div>
    )
  }

  const inComparison = vehicleIds.includes(vehicle.id)
  const safetyFeatures = [vehicle.hasAbs && 'ABS', vehicle.hasStabilityControl && 'Control de estabilidad']
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="flex flex-col gap-6">
      <Link to="/" className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeftIcon className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="lg:w-1/2">
          <img
            src={vehicle.mainImageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="aspect-video w-full rounded-3xl object-cover"
          />
        </div>
        <div className="flex flex-1 flex-col gap-6">
          <div>
            <p className="text-xs font-semibold tracking-wide text-accent uppercase">{vehicle.category}</p>
            <h1 className="mt-1 text-3xl font-bold text-foreground">
              {vehicle.brand} {vehicle.model} {vehicle.trim}
            </h1>
            <p className="text-muted">{vehicle.year}</p>
          </div>

          {vehicle.highlights.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {vehicle.highlights.map((h) => (
                <Chip key={h} color="accent" variant="soft" size="sm">
                  {h}
                </Chip>
              ))}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {vehicle.fuelEconomyNormalizedKmPerL ? (
              <SpecCard
                icon={<FuelIcon className="h-5 w-5" />}
                label="Consumo"
                value={`${vehicle.fuelEconomyNormalizedKmPerL.toFixed(1)} km/L`}
                caption={FUEL_LABEL[vehicle.fuelType]}
              />
            ) : null}
            {vehicle.trunkCapacityL ? (
              <SpecCard
                icon={<TrunkIcon className="h-5 w-5" />}
                label="Capacidad de baúl"
                value={`${vehicle.trunkCapacityL} L`}
                caption={vehicle.passengerCapacity ? `${vehicle.passengerCapacity} pasajeros` : null}
              />
            ) : null}
            {vehicle.airbagsCount ? (
              <SpecCard
                icon={<ShieldIcon className="h-5 w-5" />}
                label="Seguridad"
                value={`${vehicle.airbagsCount} airbags`}
                caption={safetyFeatures || null}
              />
            ) : null}
            <SpecCard
              label="Precio todo incluido"
              value={formatPrice(vehicle.price)}
              caption={vehicle.priceIncludes ? `Incluye: ${vehicle.priceIncludes}` : null}
            />
          </div>

          <Button
            variant={inComparison ? 'danger-soft' : 'primary'}
            className="w-fit"
            isDisabled={!inComparison && isFull}
            onPress={() => (inComparison ? removeVehicle(vehicle.id) : addVehicle(vehicle.id))}
          >
            {inComparison ? 'Quitar de comparación' : 'Agregar a comparación'}
          </Button>

          <hr className="border-separator" />

          <div>
            <h2 className="mb-2 font-medium text-foreground">Motor y desempeño</h2>
            <Spec label="Cilindrada" value={vehicle.displacementCc ? `${vehicle.displacementCc} cc` : null} />
            <Spec label="Cilindros" value={vehicle.cylinders} />
            <Spec label="Potencia" value={vehicle.horsepowerHp ? `${vehicle.horsepowerHp} hp` : null} />
            <Spec label="Torque" value={vehicle.torqueNm ? `${vehicle.torqueNm} Nm` : null} />
            <Spec label="Combustible" value={FUEL_LABEL[vehicle.fuelType]} />
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
            <h2 className="mb-2 font-medium text-foreground">Dimensiones y capacidad</h2>
            <Spec label="Baúl" value={vehicle.trunkCapacityL ? `${vehicle.trunkCapacityL} L` : null} />
            <Spec label="Pasajeros" value={vehicle.passengerCapacity} />
            <Spec label="Peso" value={vehicle.weightKg ? `${vehicle.weightKg} kg` : null} />
          </div>

          <div>
            <h2 className="mb-2 font-medium text-foreground">Seguridad y confort</h2>
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
    </div>
  )
}
