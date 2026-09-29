import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function HistoryPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="History"
        description="Historial de operaciones simuladas."
      />

      <EmptyState
        title="History en construcción"
        description="Aquí verás compras, ventas, P&L realizado y transacciones simuladas."
      />
    </section>
  )
}