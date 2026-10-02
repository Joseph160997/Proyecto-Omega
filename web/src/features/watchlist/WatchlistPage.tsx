import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function WatchlistPage() {
  return (
    <section className="space-y-6">
      <PageHeader title="Watchlist" description="Activos favoritos y seguimiento rápido." />

      <EmptyState
        title="Watchlist en construcción"
        description="Aquí podrás agregar activos, crear alertas y ver movimientos relevantes."
      />
    </section>
  )
}
