import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { archiveVehicle, listVehicles, publishVehicle } from '../../api/vehicles'
import type { Vehicle } from '../../types/vehicle'
import { ApiError } from '../../api/client'

function formatPrice(price: number): string {
  return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function AdminVehicleTable() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  function reload() {
    setVehicles(null)
    // includeUnpublished se fuerza a true del lado del backend cuando la
    // request viene autenticada (ver CEB-13) — no hace falta pasar nada acá.
    listVehicles().then(setVehicles).catch(() => setError('No pudimos cargar los vehículos'))
  }

  useEffect(reload, [])

  async function toggle(vehicle: Vehicle) {
    setBusyId(vehicle.id)
    setError(null)
    try {
      if (vehicle.isPublished) await archiveVehicle(vehicle.id)
      else await publishVehicle(vehicle.id)
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos actualizar el vehículo')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehículos</h1>
        <Link
          to="/admin/vehiculos/nuevo"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Nuevo vehículo
        </Link>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
      {vehicles === null ? <p className="text-neutral-500">Cargando...</p> : null}

      {vehicles ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="p-3">Marca</th>
                <th className="p-3">Modelo</th>
                <th className="p-3">Año</th>
                <th className="p-3">Precio</th>
                <th className="p-3">Categoría</th>
                <th className="p-3">Estado</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id} className="border-t border-neutral-100">
                  <td className="p-3">{v.brand}</td>
                  <td className="p-3">
                    {v.model} {v.trim}
                  </td>
                  <td className="p-3">{v.year}</td>
                  <td className="p-3">{formatPrice(v.price)}</td>
                  <td className="p-3">{v.category}</td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        v.isPublished ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      {v.isPublished ? 'Publicado' : 'Archivado'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/admin/vehiculos/${v.id}/editar`}
                        className="text-blue-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === v.id}
                        onClick={() => toggle(v)}
                        className="text-neutral-500 hover:underline disabled:opacity-50"
                      >
                        {v.isPublished ? 'Archivar' : 'Publicar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {vehicles.length === 0 ? (
            <p className="p-4 text-center text-neutral-500">Todavía no hay vehículos cargados.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
