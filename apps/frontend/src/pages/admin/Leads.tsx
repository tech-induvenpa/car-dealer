import { useEffect, useState } from 'react'
import { listLeads, updateLeadStatus } from '../../api/leads'
import type { Lead, LeadStatus } from '../../types/lead'
import { ApiError } from '../../api/client'

const ALL_STATUSES: LeadStatus[] = ['NUEVO', 'CONTACTADO', 'CONVERTIDO', 'DESCARTADO']

export function AdminLeads() {
  const [leads, setLeads] = useState<Lead[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  function reload() {
    setLeads(null)
    listLeads().then(setLeads).catch(() => setError('No pudimos cargar los leads'))
  }

  useEffect(reload, [])

  async function changeStatus(lead: Lead, status: LeadStatus) {
    setBusyId(lead.id)
    setError(null)
    try {
      await updateLeadStatus(lead.id, status)
      reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos cambiar el estado')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Leads</h1>

      {error ? <p className="text-red-600">{error}</p> : null}
      {leads === null ? <p className="text-neutral-500">Cargando...</p> : null}

      {leads ? (
        <div className="overflow-x-auto rounded-xl border border-neutral-200">
          <table className="w-full min-w-max text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Teléfono</th>
                <th className="p-3">Vehículos</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-neutral-100">
                  <td className="p-3">
                    {lead.firstName} {lead.lastName}
                  </td>
                  <td className="p-3">{lead.phone}</td>
                  <td className="p-3">{lead.vehicleIds.join(', ')}</td>
                  <td className="p-3">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">
                    <select
                      className="rounded-lg border border-neutral-300 px-2 py-1 text-sm"
                      value={lead.status}
                      disabled={busyId === lead.id}
                      onChange={(e) => changeStatus(lead, e.target.value as LeadStatus)}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 ? (
            <p className="p-4 text-center text-neutral-500">Todavía no hay leads.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
