import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function DashboardPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Resumen de mercado, portafolio, watchlist y alertas."
      />

      <EmptyState
        title="Dashboard en construcción"
        description="Aquí verás el resumen general del mercado, tu portafolio, movimientos importantes y el daily briefing."
      />
    </section>
  )
}