import type { ReactNode } from 'react'
import { Card } from '@heroui/react'

export function SpecCard({
  icon,
  label,
  value,
  caption,
}: {
  icon?: ReactNode
  label: string
  value: string
  caption?: string | null
}) {
  return (
    <Card variant="secondary" className="gap-2">
      {icon ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
          {icon}
        </div>
      ) : null}
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      <p className="text-xl font-bold text-foreground">{value}</p>
      {caption ? <p className="text-sm text-muted">{caption}</p> : null}
    </Card>
  )
}
