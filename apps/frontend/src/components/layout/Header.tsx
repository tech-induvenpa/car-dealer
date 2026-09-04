import { Link } from 'react-router-dom'
import { GridIcon, NewChatIcon } from '../icons'

const ICON_BUTTON =
  'flex h-10 w-10 items-center justify-center rounded-3xl border border-border text-foreground hover:bg-default'

// CEB-83: sin bandeja de comparación, así que sin badge.
//
// "Nueva conversación" vive acá y no dentro del chat, pero la acción la ejecuta
// el Assistant —es su estado—. Se comunica por la URL (`?nueva=1`) en vez de
// por un contexto o un event bus: la intención queda expresada en la ruta, que
// es algo que el router ya sabe manejar, y así el botón también funciona desde
// el catálogo o desde una ficha.
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-display text-lg font-extrabold tracking-tight text-foreground">
          Car Dealer
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/catalogo" className={ICON_BUTTON} aria-label="Ver el catálogo" title="Catálogo">
            <GridIcon className="h-[18px] w-[18px]" />
          </Link>
          <Link
            to="/?nueva=1"
            className={ICON_BUTTON}
            aria-label="Empezar una conversación nueva"
            title="Nueva conversación"
          >
            <NewChatIcon className="h-[18px] w-[18px]" />
          </Link>
        </nav>
      </div>
    </header>
  )
}
