import { Link } from 'react-router-dom'
import { Card, Chip } from '@heroui/react'
import type { Vehicle } from '../../types/vehicle'

const CATEGORY_LABEL: Record<Vehicle['category'], string> = {
  SUV: 'SUV',
  SEDAN: 'Sedán',
  PICKUP: 'Pickup',
  HATCHBACK: 'Hatchback',
  COMPACTO: 'Compacto',
  MINIVAN: 'Minivan',
}

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

// CEB-83: murió el botón "agregar a comparación" — sin bandeja, la tarjeta
// solo lleva a la ficha.
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
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
        <p className="font-display text-lg font-bold tracking-tight">{formatPrice(vehicle.price)}</p>
      </div>
    </Card>
  )
}
