import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Spinner, buttonVariants } from '@heroui/react'
import { compareVehicles } from '../../api/vehicles'
import type { ComparisonResult } from '../../types/vehicle'
import type { Verdict } from '../../types/agent'
import { formatPrice, SPEC_ROW_BY_FIELD, SPEC_ROWS } from '../vehicle/spec-rows'
import { CheckIcon } from '../icons'

// Las filas que se muestran bajo el veredicto: el Campo decisivo primero —es
// lo que sostiene el título, y el comprador tiene que poder verificarlo sin
// salir de la pantalla— y luego unas pocas que suelen importar.
const SUPPORTING_FIELDS = ['horsepowerHp', 'airbagsCount', 'warrantyYears', 'trunkCapacityL']

// CEB-82 — la tarjeta de Veredicto.
//
// Semántica de color, y es fácil de romper: el VERDE marca ÚNICAMENTE al
// Vehículo recomendado. El Ganador de comparación por fila va en negrita +
// estrella. Si se usara verde para las dos cosas, una fila ganada por el
// vehículo NO recomendado aparecería en verde del lado equivocado.
export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const [result, setResult] = useState<ComparisonResult | null>(null)

  const comparedKey = verdict.comparedVehicleIds.join(',')

  useEffect(() => {
    let cancelled = false
    compareVehicles(verdict.comparedVehicleIds)
      .then((res) => {
        if (!cancelled) setResult(res)
      })
      .catch(() => {
        /* la tarjeta se degrada al titular + razón, que es lo esencial */
      })
    return () => {
      cancelled = true
    }
    // ponytail: join como key estable — el array cambia de identidad en cada
    // render del padre (mismo criterio que VehiclePanel).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparedKey])

  const recommended = result?.vehicles.find((v) => v.id === verdict.recommendedVehicleId)
  const other = result?.vehicles.find((v) => v.id !== verdict.recommendedVehicleId)
  const decisiveRow = SPEC_ROW_BY_FIELD[verdict.decisiveField]
  const rows = [
    decisiveRow,
    ...SPEC_ROWS.filter((r) => SUPPORTING_FIELDS.includes(r.field) && r.field !== verdict.decisiveField),
  ].filter(Boolean)

  return (
    <div className="overflow-hidden rounded-3xl bg-surface shadow-surface">
      <div className="flex flex-col gap-2 p-5">
        <span className="flex w-fit items-center gap-1.5 rounded-2xl bg-success-soft px-2.5 py-0.5 text-xs leading-5 font-semibold text-success-soft-foreground">
          <CheckIcon className="h-3 w-3" /> Para ti
        </span>
        <h2 className="font-display text-2xl leading-tight font-bold tracking-tight text-pretty">
          {recommended ? `El ${recommended.model}, por ${decisiveRow?.label.toLowerCase() ?? 'lo que te importa'}` : 'Mi recomendación'}
        </h2>
        <p className="text-sm leading-relaxed text-pretty text-muted">{verdict.reason}</p>
      </div>

      {recommended && other ? (
        <>
          <div className="grid grid-cols-2 border-t border-separator">
            <div className="border-r border-separator p-3">
              <p className="text-[13px] leading-tight text-muted">
                {other.brand} {other.model}
              </p>
              <p className="font-display text-base font-bold tracking-tight">{formatPrice(other.price)}</p>
            </div>
            {/* el único verde de la tarjeta: el recomendado */}
            <div className="bg-success-soft p-3">
              <p className="text-[13px] leading-tight font-semibold text-success-soft-foreground">
                {recommended.brand} {recommended.model}
              </p>
              <p className="font-display text-base font-bold tracking-tight text-success-soft-foreground">
                {formatPrice(recommended.price)}
              </p>
            </div>
          </div>

          {rows.map((row) => {
            const winners = result?.winners[row.field] ?? []
            return (
              <div key={row.field} className="border-t border-separator px-4 py-2.5">
                <p className="mb-0.5 text-xs leading-4 text-muted">{row.label}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[other, recommended].map((v) => (
                    <span
                      key={v.id}
                      className={`text-sm text-foreground ${winners.includes(v.id) ? 'font-bold' : ''}`}
                    >
                      {row.format(v)}
                      {winners.includes(v.id) ? ' ★' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}

          <div className="border-t border-separator p-3">
            <Link
              to={`/comparar?ids=${verdict.comparedVehicleIds.join(',')}`}
              className={buttonVariants({ variant: 'outline', fullWidth: true })}
            >
              Ver todos los números
            </Link>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center gap-2 border-t border-separator py-6 text-muted">
          <Spinner size="sm" /> Cargando los números...
        </div>
      )}
    </div>
  )
}
