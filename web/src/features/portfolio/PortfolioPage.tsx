import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function PortfolioPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Portafolio virtual, posiciones, P&L y asignación."
      />

      <EmptyState
        title="Portfolio en construcción"
        description="Aquí verás tu cash, posiciones, ganancias, pérdidas y distribución del portafolio."
      />
    </section>
  )
}