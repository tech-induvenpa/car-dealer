import { useEffect, useState } from 'react'
import { getDashboard, type DashboardResult, type PairCount, type VehicleCount } from '../../api/analytics'

function RankingList({ title, items }: { title: string; items: VehicleCount[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <h2 className="mb-3 font-medium">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay datos.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item.vehicleId} className="flex justify-between text-sm">
              <span>
                {i + 1}. Vehículo #{item.vehicleId}
              </span>
              <span className="font-medium">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function PairList({ items }: { items: PairCount[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <h2 className="mb-3 font-medium">Pares comparados con más frecuencia</h2>
      {items.length === 0 ? (
        <p className="text-sm text-neutral-500">Todavía no hay datos.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item.vehicleIds.join('-')} className="flex justify-between text-sm">
              <span>
                {i + 1}. Vehículo #{item.vehicleIds[0]} + Vehículo #{item.vehicleIds[1]}
              </span>
              <span className="font-medium">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export function AdminDashboard() {
  const [data, setData] = useState<DashboardResult | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getDashboard().then(setData).catch(() => setError(true))
  }, [])

  if (error) return <p className="text-red-600">No pudimos cargar el dashboard.</p>
  if (!data) return <p className="text-neutral-500">Cargando...</p>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RankingList title="Más vistos" items={data.topViewed} />
        <RankingList title="Más comparados" items={data.topCompared} />
        <PairList items={data.topPairs} />
        <RankingList title="Leads por vehículo" items={data.leadsByVehicle} />
      </div>
    </div>
  )
}
