interface IconProps {
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// ponytail: set chico de iconos inline (sin sumar una dependencia nueva) —
// solo los que usan las tarjetas de ficha técnica. Si el sitio termina
// necesitando muchos más, ahí sí vale la pena evaluar una librería.
export function FuelIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3c-3.5 4-5 6.5-5 9a5 5 0 0 0 10 0c0-2.5-1.5-5-5-9Z" />
    </svg>
  )
}

export function TrunkIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M3 8l2-4h14l2 4" />
      <path d="M9 12h6" />
    </svg>
  )
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  )
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  )
}

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

export function CompareIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base}>
      <path d="M7 8h13M17 4l3 4-3 4" />
      <path d="M17 16H4M7 20l-3-4 3-4" />
    </svg>
  )
}

export function WarningIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    </svg>
  )
}

export function GridIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

export function NewChatIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20l1.1-3.9A8.4 8.4 0 0 1 11.5 3a8.4 8.4 0 0 1 8.5 8.5z" />
      <path d="M12 8v6" />
      <path d="M9 11h6" />
    </svg>
  )
}

