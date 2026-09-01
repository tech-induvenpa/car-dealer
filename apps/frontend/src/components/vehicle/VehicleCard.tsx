import { Link } from 'react-router-dom'
import { Button, Card, Chip } from '@heroui/react'
import type { Vehicle } from '../../types/vehicle'
import { useComparison } from '../../context/ComparisonContext'

const CATEGORY_LABEL: Record<Vehicle['category'], string> = {
  SUV: 'SUV',
  SEDAN: 'Sedán',
  PICKUP: 'Pickup',
  HATCHBACK: 'Hatchback',
  COMPACTO: 'Compacto',
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { vehicleIds, addVehicle, removeVehicle, isFull } = useComparison()
  const inComparison = vehicleIds.includes(vehicle.id)

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0">
      <Link to={`/vehiculos/${vehicle.id}`}>
        <img
          src={vehicle.mainImageUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="aspect-video w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Chip size="sm" className="w-fit">
          {CATEGORY_LABEL[vehicle.category]}
        </Chip>
        <Link to={`/vehiculos/${vehicle.id}`} className="font-medium leading-tight hover:underline">
          {vehicle.brand} {vehicle.model} {vehicle.trim}
        </Link>
        <p className="text-sm text-muted">{vehicle.year}</p>
        <p className="text-lg font-semibold">{formatPrice(vehicle.price)}</p>
        <Button
          variant={inComparison ? 'danger-soft' : 'primary'}
          fullWidth
          className="mt-auto"
          isDisabled={!inComparison && isFull}
          onPress={() => (inComparison ? removeVehicle(vehicle.id) : addVehicle(vehicle.id))}
        >
          {inComparison ? 'Quitar de comparación' : 'Agregar a comparación'}
        </Button>
      </div>
    </Card>
  )
}
