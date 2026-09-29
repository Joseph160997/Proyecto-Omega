import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function MarketsPage() {
  return (
    <section className="space-y-6">
      <PageHeader
        title="Markets"
        description="Criptomonedas, acciones, divisas, índices y materias primas."
      />

      <EmptyState
        title="Markets en construcción"
        description="Aquí verás la tabla global de activos con búsqueda, filtros, sparklines y quick actions."
      />
    </section>
  )
}