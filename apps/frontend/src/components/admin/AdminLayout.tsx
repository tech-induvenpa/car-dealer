import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function AdminLayout() {
  const { logout } = useAuth()

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link to="/admin" className="text-lg font-semibold">
              Car Dealer Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link to="/admin" className="text-neutral-500 hover:text-neutral-900">
                Dashboard
              </Link>
              <Link to="/admin/vehiculos" className="text-neutral-500 hover:text-neutral-900">
                Vehículos
              </Link>
              <Link to="/admin/leads" className="text-neutral-500 hover:text-neutral-900">
                Leads
              </Link>
            </nav>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
