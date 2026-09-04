import { useEffect, useState } from 'react'
import { compareVehicles } from '../../api/vehicles'
import type { ComparisonResult, Vehicle } from '../../types/vehicle'
import { SPEC_ROW_BY_FIELD } from '../vehicle/spec-rows'

// Campos que valen como argumento de reparto — los que un comprador reconoce
// como "esto lo gana uno u otro". El resto de la ficha empata o no orienta.
const SPLIT_FIELDS = [
  'price',
  'horsepowerHp',
  'torqueNm',
  'fuelEconomyNormalizedKmPerL',
  'airbagsCount',
  'warrantyYears',
  'trunkCapacityL',
]

// CEB-86 — cómo se ve la regla 9: sin ganador claro NO hay Veredicto.
//
// No dice "no puedo decidir" y ya: muestra cómo se reparten, agrupado por quién
// gana qué, y deja que el Agente haga la pregunta que desempata.
//
// Requisito, no estética: CERO verde, cero estrellas, sin la etiqueta "para
// vos". En el Veredicto el verde significa "este te recomiendo"; acá no hay
// recomendado, así que usar el mismo lenguaje visual insinuaría un ganador que
// no existe.
export function SplitCard({ vehicleIds }: { vehicleIds: number[] }) {
  const [result, setResult] = useState<ComparisonResult | null>(null)

  const idsKey = vehicleIds.join(',')

  useEffect(() => {
    let cancelled = false
    compareVehicles(vehicleIds)
      .then((res) => {
        if (!cancelled) setResult(res)
      })
      .catch(() => {
        /* sin datos no se muestra la tarjeta; el mensaje del Agente alcanza */
      })
    return () => {
      cancelled = true
    }
    // ponytail: join como key estable — el array cambia de identidad en cada
    // render del padre (mismo criterio que VehiclePanel).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey])

  if (!result || result.vehicles.length !== 2) return null

  const groups = result.vehicles
    .map((vehicle) => ({
      vehicle,
      fields: SPLIT_FIELDS.filter((f) => {
        const winners = result.winners[f] ?? []
        return winners.length === 1 && winners[0] === vehicle.id
      }),
    }))
    .filter((g) => g.fields.length > 0)

  // Si uno gana todo, esto no es un reparto y la tarjeta no aporta nada.
  if (groups.length < 2) return null

  const otherOf = (v: Vehicle) => result.vehicles.find((x) => x.id !== v.id) as Vehicle

  return (
    <div className="overflow-hidden rounded-3xl bg-surface shadow-surface">
      <div className="flex flex-col gap-1.5 p-5">
        <span className="w-fit rounded-2xl bg-surface-tertiary px-2.5 py-0.5 text-xs leading-5 font-semibold text-muted">
          Parejos
        </span>
        <h2 className="font-display text-xl leading-tight font-bold tracking-tight text-pretty">
          Se reparten
        </h2>
        <p className="text-sm leading-relaxed text-pretty text-muted">
          Cada uno gana en cosas que suelen importar. Con lo que me has contado hasta ahora no tengo cómo desempatar sin
          inventarte una razón.
        </p>
      </div>

      {groups.map(({ vehicle, fields }) => (
        <div key={vehicle.id} className="border-t border-separator px-4 py-3">
          <p className="mb-2 text-[11px] leading-4 font-semibold tracking-wider text-muted uppercase">
            Gana el {vehicle.model}
          </p>
          <div className="flex flex-col gap-1.5">
            {fields.map((field) => {
              const row = SPEC_ROW_BY_FIELD[field]
              if (!row) return null
              return (
                <div key={field} className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-muted">{row.label}</span>
                  <span className="text-sm text-foreground">
                    <strong className="font-bold">{row.format(vehicle)}</strong>{' '}
                    <span className="text-muted">vs {row.format(otherOf(vehicle))}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
