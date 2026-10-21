import { useLedger } from '@/app/providers/LedgerProvider'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { describeLedgerRepositoryError } from '@/features/account/ledgerErrors'
import { PortfolioWorkspace } from '@/features/portfolio/PortfolioWorkspace'

export function PortfolioPage() {
  const ledger = useLedger()

  if (ledger.status === 'loading') {
    return (
      <section className="space-y-6">
        <PageHeader title="Portfolio" description="Cuenta simulada, posiciones y operaciones." />
        <p role="status" className="text-sm text-fg-muted">
          Cargando cuenta…
        </p>
      </section>
    )
  }

  if (ledger.status === 'error') {
    return (
      <section className="space-y-6">
        <PageHeader title="Portfolio" description="Cuenta simulada, posiciones y operaciones." />
        <EmptyState
          title="No se pudo abrir la cuenta"
          description={`${describeLedgerRepositoryError(ledger.error)} Tus datos no se han reemplazado.`}
        />
        <Button onClick={ledger.retry}>Reintentar conexión</Button>
      </section>
    )
  }

  return <PortfolioWorkspace services={ledger.services} />
}
