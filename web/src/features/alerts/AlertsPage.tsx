import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'

export function AlertsPage() {
  return (
    <section className="space-y-6">
      <PageHeader title="Alerts" description="Alertas de precio, cambios y riesgo." />

      <EmptyState
        title="Alerts en construcción"
        description="Aquí podrás crear, editar y revisar alertas de precio o condiciones de portafolio."
      />
    </section>
  )
}
