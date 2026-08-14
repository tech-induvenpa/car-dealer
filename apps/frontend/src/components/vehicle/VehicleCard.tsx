import { Link } from 'react-router-dom'
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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <Link to={`/vehiculos/${vehicle.id}`}>
        <img
          src={vehicle.mainImageUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="aspect-video w-full object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
          {CATEGORY_LABEL[vehicle.category]}
        </span>
        <Link to={`/vehiculos/${vehicle.id}`} className="font-medium leading-tight hover:underline">
          {vehicle.brand} {vehicle.model} {vehicle.trim}
        </Link>
        <p className="text-sm text-neutral-500">{vehicle.year}</p>
        <p className="text-lg font-semibold">{formatPrice(vehicle.price)}</p>
        <button
          type="button"
          disabled={!inComparison && isFull}
          onClick={() => (inComparison ? removeVehicle(vehicle.id) : addVehicle(vehicle.id))}
          className={`mt-auto w-full rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
            inComparison
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {inComparison ? 'Quitar de comparación' : 'Agregar a comparación'}
        </button>
      </div>
    </div>
  )
}
