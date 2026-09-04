import { useState, type FormEvent } from 'react'
import { Button, Card, Input } from '@heroui/react'
import { createLead } from '../../api/leads'
import { ApiError } from '../../api/client'

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
      <Card className="bg-success-soft text-success-soft-foreground">
        <p>¡Gracias, {firstName}! Un asesor te va a contactar pronto.</p>
      </Card>
    )
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h3 className="font-medium">¿Te interesa alguno de estos? Déjanos tus datos</h3>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            fullWidth
            placeholder="Nombre"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            fullWidth
            placeholder="Apellido"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
        <Input
          fullWidth
          placeholder="Teléfono"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        {status === 'error' ? (
          <p className="text-sm text-danger">No pudimos enviar tus datos, intentá de nuevo.</p>
        ) : null}
        <Button type="submit" fullWidth isDisabled={status === 'submitting'}>
          {status === 'submitting' ? 'Enviando...' : 'Quiero que me contacten'}
        </Button>
      </form>
    </Card>
  )
}
