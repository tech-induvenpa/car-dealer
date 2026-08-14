import { useState, type FormEvent } from 'react'
import { createLead } from '../../api/leads'
import { ApiError } from '../../api/client'

const inputClass =
  'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none'

export function LeadForm({ vehicleIds }: { vehicleIds: number[] }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    try {
      await createLead({ firstName, lastName, phone, vehicleIds })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      console.error(err instanceof ApiError ? err.message : err)
    }
  }

  if (status === 'done') {
    return (
      <p className="rounded-lg bg-green-50 p-4 text-green-700">
        ¡Gracias, {firstName}! Un asesor te va a contactar pronto.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4">
      <h3 className="font-medium">¿Te interesa alguno de estos? Dejanos tus datos</h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className={inputClass}
          placeholder="Nombre"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          className={inputClass}
          placeholder="Apellido"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>
      <input
        className={inputClass}
        placeholder="Teléfono"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        required
      />
      {status === 'error' ? (
        <p className="text-sm text-red-600">No pudimos enviar tus datos, intentá de nuevo.</p>
      ) : null}
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {status === 'submitting' ? 'Enviando...' : 'Quiero que me contacten'}
      </button>
    </form>
  )
}
