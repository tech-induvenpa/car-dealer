import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, buttonVariants } from '@heroui/react'
import { useComparison } from '../../context/ComparisonContext'
import { getActiveConversation } from '../../api/agent'

export function Header() {
  const { vehicleIds } = useComparison()
  const [hasActiveConversation, setHasActiveConversation] = useState(false)

  useEffect(() => {
    getActiveConversation().then((conversation) => setHasActiveConversation(Boolean(conversation)))
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-foreground">
          Car Dealer
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/" className="text-sm text-muted hover:text-foreground">
            Catálogo
          </Link>
          {hasActiveConversation ? (
            <Link to="/asistente" className="text-sm text-muted hover:text-foreground">
              Volver al chat
            </Link>
          ) : null}
          {vehicleIds.length > 0 ? (
            <Badge.Anchor>
              <Link to="/comparar" className={buttonVariants({ size: 'sm' })}>
                Comparar
              </Link>
              <Badge color="danger" placement="top-right">
                {vehicleIds.length}
              </Badge>
            </Badge.Anchor>
          ) : null}
        </nav>
      </div>
    </header>
  )
}
