import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card, Input, Spinner, buttonVariants } from '@heroui/react'
import { listVehicles } from '../../api/vehicles'
import type { Vehicle } from '../../types/vehicle'
import { VehicleCard } from '../../components/vehicle/VehicleCard'

const BRANDS = [
  'TOYOTA', 'KIA', 'CHANGAN', 'CHEVROLET', 'FORD', 'HONDA', 'HYUNDAI', 'MITSUBISHI',
  'JEEP', 'CHRYSLER', 'DODGE', 'RAM', 'BUICK', 'CADILLAC', 'LINCOLN', 'MERCURY',
  'PONTIAC', 'HUMMER', 'VOLKSWAGEN', 'AUDI', 'BMW', 'MERCEDES_BENZ', 'PORSCHE', 'MINI',
  'FIAT', 'ALFA_ROMEO', 'RENAULT', 'PEUGEOT', 'CITROEN', 'SEAT', 'SKODA',
  'ASTON_MARTIN', 'LAND_ROVER', 'CHERY', 'BYD', 'GEELY', 'GREAT_WALL', 'JAC', 'JMC',
  'LIFAN', 'WULING', 'ZHONGXING', 'ZOTYE', 'HAFEI', 'CHANA', 'CHANGHE', 'VENIRAUTO',
  'VIT', 'DONGFENG', 'FORTHING', 'FOTON', 'ISUZU', 'IVECO', 'MACK',
] as const
const CATEGORIES = ['SUV', 'SEDAN', 'PICKUP', 'HATCHBACK', 'COMPACTO'] as const

const selectClass = 'rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground'

export function Catalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState(false)

  const brand = searchParams.get('brand') ?? ''
  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''

  useEffect(() => {
    setVehicles(null)
    setError(false)
    listVehicles({
      brand: (brand as Vehicle['brand']) || undefined,
      category: (category as Vehicle['category']) || undefined,
      search: search || undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    })
      .then(setVehicles)
      .catch(() => setError(true))
  }, [brand, category, search, maxPrice])

  function updateParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card variant="secondary" className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold">Encontrá tu próximo vehículo</h1>
          <p className="text-muted">Compará hasta 4 vehículos lado a lado.</p>
        </div>
        <Link to="/quiz" className={buttonVariants()}>
          Ayudame a elegir
        </Link>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          className={selectClass}
          value={brand}
          onChange={(e) => updateParam('brand', e.target.value)}
        >
          <option value="">Todas las marcas</option>
          {BRANDS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Input
          fullWidth
          placeholder="Buscar modelo o versión"
          value={search}
          onChange={(e) => updateParam('search', e.target.value)}
        />
      </div>

      {error ? <p className="text-danger">No pudimos cargar el catálogo.</p> : null}
      {vehicles === null && !error ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted">
          <Spinner /> Cargando...
        </div>
      ) : null}
      {vehicles?.length === 0 ? (
        <p className="text-muted">No encontramos vehículos con esos filtros.</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles?.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
      </div>
    </div>
  )
}
