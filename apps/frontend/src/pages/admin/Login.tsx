import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ApiError } from '../../api/client'

const inputClass = 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'

export function AdminLogin() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/admin" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No pudimos iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h1 className="text-xl font-semibold">Car Dealer Admin</h1>
        <input
          className={inputClass}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
