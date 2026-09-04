import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Chip, Spinner, buttonVariants } from '@heroui/react'
import { compareVehicles } from '../../api/vehicles'
import { trackEvent } from '../../api/analytics'
import type { ComparisonResult, Vehicle } from '../../types/vehicle'
import { formatPrice, SPEC_ROWS, type SpecRowDef } from '../../components/vehicle/spec-rows'
import { LeadForm } from '../../components/lead/LeadForm'

// CEB-79 — el arreglo del defecto que originó todo el pivote.
//
// Antes era una <table> con overflow-x y la columna de etiquetas SIN fijar: al
// desplazarse para ver el tercer o cuarto vehículo, las etiquetas se iban con
// el scroll y quedaba una columna de números sin referencia.
//
// Ahora la etiqueta ocupa su propia fila a lo ancho y los valores van debajo,
// así que nunca hay scroll horizontal y nunca se pierde de vista qué se está
// mirando. En escritorio la etiqueta vuelve a la izquierda: mismo componente
// con un breakpoint, no un segundo diseño.
function SpecRow({
  row,
  vehicles,
  winners,
}: {
  row: SpecRowDef
  vehicles: Vehicle[]
  winners: Record<string, number[]>
}) {
  return (
    <div className="border-t border-separator px-4 py-2.5 sm:grid sm:grid-cols-[minmax(0,200px)_1fr] sm:items-baseline sm:gap-4">
      <p className="text-xs leading-4 text-muted sm:text-sm">{row.label}</p>
      <div
        className="mt-1 grid gap-3 sm:mt-0"
        style={{ gridTemplateColumns: `repeat(${vehicles.length}, minmax(0, 1fr))` }}
      >
        {vehicles.map((v) => {
          const isWinner = winners[row.field]?.includes(v.id)
          return (
            <span
              key={v.id}
              // El Ganador de comparación va en negrita + estrella, NUNCA en
              // verde: el verde está reservado para el Vehículo recomendado
              // del Veredicto, y acá no hay recomendado. Usar el mismo color
              // para las dos cosas hace que una fila ganada por el vehículo no
              // recomendado aparezca en verde del lado equivocado.
              className={`text-[15px] text-foreground ${isWinner ? 'font-bold' : ''}`}
            >
              {row.format(v)}
              {isWinner ? ' ★' : ''}
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function Comparison() {
  const [searchParams] = useSearchParams()

  const ids = useMemo(() => {
    const fromQuery = searchParams.get('ids')
    if (!fromQuery) return []
    return fromQuery.split(',').map(Number).filter(Boolean)
  }, [searchParams])

  const [result, setResult] = useState<ComparisonResult | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (ids.length < 2) return
    setResult(null)
    setError(false)
    compareVehicles(ids)
      .then((res) => {
        setResult(res)
        trackEvent({ type: 'COMPARISON_PERFORMED', vehicleIds: ids })
      })
      .catch(() => setError(true))
  }, [ids])

  if (ids.length < 2) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-muted">Cuéntale al asistente qué buscas y te lleva a la comparación que te sirve.</p>
        <Link to="/" className={buttonVariants()}>
          Ir al asistente
        </Link>
      </div>
    )
  }

  if (error) {
    return <p className="text-danger">No pudimos armar la comparación.</p>
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-muted">
        <Spinner /> Cargando...
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {result.categoryMismatch ? (
        <div className="rounded-2xl bg-warning-soft p-4 text-warning-soft-foreground">
          Estás comparando vehículos de categorías bastante distintas — la comparación puede no ser del todo justa.
        </div>
      ) : null}

      <div className="overflow-hidden rounded-3xl bg-surface shadow-surface">
        {/* La cabecera queda fija mientras se recorren las specs, así que
            siempre se ve contra qué se está comparando. */}
        <div className="sticky top-14 z-10 border-b border-border bg-surface sm:grid sm:grid-cols-[minmax(0,200px)_1fr] sm:gap-4 sm:px-4">
          <p className="hidden text-xs leading-4 font-semibold tracking-wider text-muted uppercase sm:block sm:self-end sm:pb-4">
            Comparando
          </p>
          <div
            className="grid gap-3 p-4 sm:p-0 sm:pb-4"
            style={{ gridTemplateColumns: `repeat(${result.vehicles.length}, minmax(0, 1fr))` }}
          >
            {result.vehicles.map((v) => (
              <div key={v.id} className="flex flex-col gap-2">
                <img
                  src={v.mainImageUrl}
                  alt={`${v.brand} ${v.model}`}
                  className="aspect-video w-full rounded-xl object-cover"
                />
                <div>
                  <Chip size="sm">{v.category}</Chip>
                  <p className="mt-1 text-sm leading-tight font-semibold">
                    {v.brand} {v.model} {v.trim}
                  </p>
                  <p className="font-display text-lg font-bold tracking-tight">{formatPrice(v.price)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {SPEC_ROWS.map((row) => (
            <SpecRow key={row.field} row={row} vehicles={result.vehicles} winners={result.winners} />
          ))}
        </div>
      </div>

      <LeadForm vehicleIds={result.vehicles.map((v) => v.id)} />

      <Link to="/" className="self-start text-sm text-accent hover:underline">
        Volver al asistente
      </Link>
    </div>
  )
}
