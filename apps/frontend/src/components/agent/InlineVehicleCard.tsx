import { useEffect, useState } from 'react'
import { Button, Card } from '@heroui/react'
import { getVehicle } from '../../api/vehicles'
import type { Vehicle } from '../../types/vehicle'
import type { PanelSelection } from '../../types/agent'
import { InfoIcon } from '../icons'

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// Variante compacta para embeber en mensajes del chat — el detalle
// completo y la comparación viven en el panel derecho (VehiclePanel),
// esta tarjeta solo dispara qué mostrar ahí (onSelect).
export function InlineVehicleCard({
  vehicleId,
  onSelect,
}: {
  vehicleId: number
  onSelect: (selection: PanelSelection) => void
}) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    getVehicle(vehicleId)
      .then((v) => {
        if (!cancelled) setVehicle(v)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [vehicleId])

  // el Agente ya valida contra catálogo antes de referenciar un vehículo
  // (CatalogGroundingGuard) — si igual falla acá, no rompemos el chat.
  if (failed) return null
  if (!vehicle) return <div className="aspect-[4/5] w-full animate-pulse rounded-2xl bg-surface-secondary" />


  return (
    <Card className="gap-0 overflow-hidden p-0">
      <img
        src={vehicle.mainImageUrl}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className="aspect-video w-full object-cover"
      />
      <div className="flex flex-col gap-2 p-3">
        <div>
          <p className="text-sm leading-tight font-medium text-foreground">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="font-display text-base font-bold tracking-tight text-foreground">{formatPrice(vehicle.price)}</p>
        </div>
        <div className="border-t border-separator pt-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onPress={() => onSelect({ mode: 'single', vehicleId: vehicle.id })}
          >
            <InfoIcon className="h-4 w-4" /> Detalle
          </Button>
        </div>
      </div>
    </Card>
  )
}
