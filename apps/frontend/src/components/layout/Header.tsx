import { Link } from 'react-router-dom'
import { useComparison } from '../../context/ComparisonContext'

export function Header() {
  const { vehicleIds } = useComparison()

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold">
          Car Dealer
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-neutral-500 hover:text-neutral-900">
            Catálogo
          </Link>
          {vehicleIds.length > 0 ? (
            <Link
              to="/comparar"
              className="relative rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Comparar
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {vehicleIds.length}
              </span>
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
