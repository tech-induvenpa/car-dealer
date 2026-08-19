import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createVehicle, getVehicle, updateVehicle } from '../../api/vehicles'
import { ApiError } from '../../api/client'
import {
  emptyVehicleForm,
  vehicleToFormInput,
  type VehicleFormInput,
} from '../../types/vehicle'

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
const FUEL_TYPES = ['GASOLINA', 'DIESEL', 'HIBRIDO', 'ELECTRICO'] as const
const TRANSMISSION_TYPES = ['MANUAL', 'AUTOMATICA', 'CVT', 'DCT'] as const
const DRIVE_TYPES = ['FWD_4X2', 'AWD_4X4'] as const
const FUEL_ECONOMY_UNITS = ['KM_POR_GAL', 'L_POR_100KM'] as const

const inputClass = 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
const labelClass = 'text-sm font-medium text-neutral-700'

function draftKey(id: string | undefined): string {
  return `car-dealer-admin-vehicle-draft-${id ?? 'new'}`
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <legend className="px-1 font-medium">{title}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </fieldset>
  )
}

export function VehicleFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditing = id !== undefined

  const [form, setForm] = useState<VehicleFormInput>(emptyVehicleForm())
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [draftAvailable, setDraftAvailable] = useState(false)
  // true una vez que ya sabemos si hay un borrador o no — el autosave se
  // pausa hasta entonces, para no pisar un borrador real con el formulario
  // vacío del montaje inicial antes de que el usuario decida restaurarlo.
  const [draftChecked, setDraftChecked] = useState(false)

  // carga: vehículo existente (si edita) o borrador guardado
  useEffect(() => {
    let cancelled = false

    async function load() {
      const draft = localStorage.getItem(draftKey(id))

      if (isEditing) {
        const vehicle = await getVehicle(Number(id)).catch(() => null)
        if (cancelled) return
        if (vehicle) setForm(vehicleToFormInput(vehicle))
        setLoading(false)
      }

      if (draft) setDraftAvailable(true)
      setDraftChecked(true)
    }

    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // autosave a localStorage, debounced — pausado mientras hay un borrador
  // sin restaurar/descartar (ver draftChecked arriba).
  useEffect(() => {
    if (loading || !draftChecked || draftAvailable) return
    const timeout = setTimeout(() => {
      localStorage.setItem(draftKey(id), JSON.stringify(form))
    }, 2000)
    return () => clearTimeout(timeout)
  }, [form, id, loading, draftChecked, draftAvailable])

  function restoreDraft() {
    const draft = localStorage.getItem(draftKey(id))
    if (draft) setForm(JSON.parse(draft))
    setDraftAvailable(false)
  }

  function discardDraft() {
    localStorage.removeItem(draftKey(id))
    setDraftAvailable(false)
  }

  function updateField<K extends keyof VehicleFormInput>(key: K, value: VehicleFormInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function updateSpec<K extends keyof VehicleFormInput['specs']>(
    key: K,
    value: VehicleFormInput['specs'][K],
  ) {
    setForm((prev) => ({ ...prev, specs: { ...prev.specs, [key]: value } }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const payload: VehicleFormInput = {
        ...form,
        priceIncludes: form.priceIncludes || undefined,
      } as VehicleFormInput
      if (isEditing) {
        await updateVehicle(Number(id), payload)
      } else {
        await createVehicle(payload)
      }
      localStorage.removeItem(draftKey(id))
      navigate('/admin/vehiculos')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos guardar el vehículo')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-neutral-500">Cargando...</p>

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">
        {isEditing ? 'Editar vehículo' : 'Nuevo vehículo'}
      </h1>

      {draftAvailable ? (
        <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          <span>Encontramos un borrador sin guardar de este formulario.</span>
          <div className="flex gap-2">
            <button type="button" onClick={restoreDraft} className="font-medium underline">
              Restaurar
            </button>
            <button type="button" onClick={discardDraft} className="font-medium underline">
              Descartar
            </button>
          </div>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Section title="General">
          <Field label="Marca">
            <select
              className={inputClass}
              value={form.brand}
              onChange={(e) => updateField('brand', e.target.value as VehicleFormInput['brand'])}
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Modelo">
            <input
              className={inputClass}
              value={form.model}
              onChange={(e) => updateField('model', e.target.value)}
              required
            />
          </Field>
          <Field label="Versión / Trim">
            <input
              className={inputClass}
              value={form.trim}
              onChange={(e) => updateField('trim', e.target.value)}
              required
            />
          </Field>
          <Field label="Año">
            <input
              className={inputClass}
              type="number"
              value={form.year}
              onChange={(e) => updateField('year', Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Categoría">
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) =>
                updateField('category', e.target.value as VehicleFormInput['category'])
              }
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="URL de imagen">
            <input
              className={inputClass}
              value={form.mainImageUrl}
              onChange={(e) => updateField('mainImageUrl', e.target.value)}
              required
            />
          </Field>
        </Section>

        <Section title="Precio">
          <Field label="Precio (USD, todo incluido)">
            <input
              className={inputClass}
              type="number"
              value={form.price}
              onChange={(e) => updateField('price', Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Incluye (opcional)">
            <input
              className={inputClass}
              value={form.priceIncludes}
              onChange={(e) => updateField('priceIncludes', e.target.value)}
              placeholder="IVA, IGTF, matriculación"
            />
          </Field>
        </Section>

        <Section title="Motor y desempeño">
          <Field label="Cilindrada (cc)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.displacementCc ?? ''}
              onChange={(e) =>
                updateSpec('displacementCc', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Cilindros">
            <input
              className={inputClass}
              type="number"
              value={form.specs.cylinders ?? ''}
              onChange={(e) =>
                updateSpec('cylinders', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Potencia (hp)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.horsepowerHp ?? ''}
              onChange={(e) =>
                updateSpec('horsepowerHp', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Torque (Nm)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.torqueNm ?? ''}
              onChange={(e) =>
                updateSpec('torqueNm', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Combustible">
            <select
              className={inputClass}
              value={form.specs.fuelType}
              onChange={(e) =>
                updateSpec('fuelType', e.target.value as VehicleFormInput['specs']['fuelType'])
              }
            >
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Transmisión">
            <select
              className={inputClass}
              value={form.specs.transmissionType}
              onChange={(e) =>
                updateSpec(
                  'transmissionType',
                  e.target.value as VehicleFormInput['specs']['transmissionType'],
                )
              }
            >
              {TRANSMISSION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Velocidades de transmisión">
            <input
              className={inputClass}
              type="number"
              value={form.specs.transmissionSpeeds ?? ''}
              onChange={(e) =>
                updateSpec('transmissionSpeeds', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Tracción">
            <select
              className={inputClass}
              value={form.specs.driveType}
              onChange={(e) =>
                updateSpec('driveType', e.target.value as VehicleFormInput['specs']['driveType'])
              }
            >
              {DRIVE_TYPES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </Section>

        <Section title="Dimensiones">
          <Field label="Largo (mm)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.lengthMm ?? ''}
              onChange={(e) => updateSpec('lengthMm', e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Ancho (mm)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.widthMm ?? ''}
              onChange={(e) => updateSpec('widthMm', e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Alto (mm)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.heightMm ?? ''}
              onChange={(e) => updateSpec('heightMm', e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Distancia entre ejes (mm)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.wheelbaseMm ?? ''}
              onChange={(e) =>
                updateSpec('wheelbaseMm', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Baúl (L)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.trunkCapacityL ?? ''}
              onChange={(e) =>
                updateSpec('trunkCapacityL', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Peso (kg)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.weightKg ?? ''}
              onChange={(e) => updateSpec('weightKg', e.target.value ? Number(e.target.value) : null)}
            />
          </Field>
          <Field label="Pasajeros">
            <input
              className={inputClass}
              type="number"
              value={form.specs.passengerCapacity ?? ''}
              onChange={(e) =>
                updateSpec('passengerCapacity', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </Section>

        <Section title="Consumo">
          <Field label="Consumo (valor tal cual del fabricante)">
            <input
              className={inputClass}
              type="number"
              step="0.1"
              value={form.specs.fuelEconomyValue ?? ''}
              onChange={(e) =>
                updateSpec('fuelEconomyValue', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Unidad">
            <select
              className={inputClass}
              value={form.specs.fuelEconomyUnit ?? ''}
              onChange={(e) =>
                updateSpec(
                  'fuelEconomyUnit',
                  (e.target.value || null) as VehicleFormInput['specs']['fuelEconomyUnit'],
                )
              }
            >
              <option value="">—</option>
              {FUEL_ECONOMY_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u === 'KM_POR_GAL' ? 'km/galón' : 'L/100km'}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Capacidad del tanque (L)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.tankCapacityL ?? ''}
              onChange={(e) =>
                updateSpec('tankCapacityL', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
        </Section>

        <Section title="Seguridad y confort">
          <Field label="Airbags">
            <input
              className={inputClass}
              type="number"
              value={form.specs.airbagsCount ?? ''}
              onChange={(e) =>
                updateSpec('airbagsCount', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Tipo de asientos">
            <input
              className={inputClass}
              value={form.specs.seatType}
              onChange={(e) => updateSpec('seatType', e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.specs.hasAbs}
              onChange={(e) => updateSpec('hasAbs', e.target.checked)}
            />
            ABS
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.specs.hasStabilityControl}
              onChange={(e) => updateSpec('hasStabilityControl', e.target.checked)}
            />
            Control de estabilidad
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.specs.hasRearCamera}
              onChange={(e) => updateSpec('hasRearCamera', e.target.checked)}
            />
            Cámara de reversa
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.specs.hasBluetooth}
              onChange={(e) => updateSpec('hasBluetooth', e.target.checked)}
            />
            Bluetooth
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.specs.hasCarPlay}
              onChange={(e) => updateSpec('hasCarPlay', e.target.checked)}
            />
            CarPlay / Android Auto
          </label>
        </Section>

        <Section title="Garantía y destacados">
          <Field label="Garantía (años)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.warrantyYears ?? ''}
              onChange={(e) =>
                updateSpec('warrantyYears', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <Field label="Garantía (km)">
            <input
              className={inputClass}
              type="number"
              value={form.specs.warrantyKm ?? ''}
              onChange={(e) =>
                updateSpec('warrantyKm', e.target.value ? Number(e.target.value) : null)
              }
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Destacados (separados por coma)">
              <input
                className={inputClass}
                value={form.specs.highlights.join(', ')}
                onChange={(e) =>
                  updateSpec(
                    'highlights',
                    e.target.value
                      .split(',')
                      .map((h) => h.trim())
                      .filter(Boolean),
                  )
                }
                placeholder="Sunroof eléctrico, Asientos de cuero"
              />
            </Field>
          </div>
        </Section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : 'Guardar vehículo'}
        </button>
      </form>
    </div>
  )
}
