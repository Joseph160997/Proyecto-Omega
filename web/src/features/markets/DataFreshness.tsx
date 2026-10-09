import { useNow } from '@/hooks/useNow'
import { formatAge } from '@/lib/format'

interface DataFreshnessProps {
  timestamp: number | undefined
}

export function DataFreshness({ timestamp }: DataFreshnessProps) {
  const now = useNow()

  if (timestamp === undefined) return null

  const clock = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <p className="text-xs text-(--text-secondary)">
      Precios de las {clock} ({formatAge(now - timestamp)})
    </p>
  )
}
