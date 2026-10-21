import { useState } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Panel } from '@/components/ui/Panel'
import { useLedger } from '@/app/providers/LedgerProvider'
import { describeLedgerRepositoryError } from '@/features/account/ledgerErrors'
import { LedgerOperationError, useLedgerSnapshot } from '@/features/portfolio/ledgerQueries'
import { formatMoney, formatUsdPrice } from '@/lib/format'
import { paginate } from '@/lib/pagination'

import type { LedgerEntry } from '@/domain/ledger/entries'
import type { LedgerServices } from '@/app/container'

const PAGE_SIZE = 20

type HistoryFilter = 'all' | 'buy' | 'sell'

const FILTERS: readonly { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'buy', label: 'Compras' },
  { id: 'sell', label: 'Ventas' },
]

function describeError(error: unknown): string {
  return error instanceof LedgerOperationError
    ? describeLedgerRepositoryError(error.repositoryError)
    : 'No se pudo cargar el historial.'
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function entryLabel(entry: LedgerEntry): string {
  if (entry.kind === 'deposit') return 'Depósito inicial'

  return entry.kind === 'buy' ? 'Compra' : 'Venta'
}

function entryAsset(entry: LedgerEntry): string {
  return entry.kind === 'deposit' ? 'Efectivo USD' : entry.assetId
}

export function HistoryPage() {
  const ledger = useLedger()

  if (ledger.status === 'loading') {
    return (
      <section className="space-y-6">
        <PageHeader title="Historial" description="Todas las operaciones de tu cuenta simulada." />
        <p role="status" className="text-sm text-fg-muted">
          Cargando historial…
        </p>
      </section>
    )
  }

  if (ledger.status === 'error') {
    return (
      <section className="space-y-6">
        <PageHeader title="Historial" description="Todas las operaciones de tu cuenta simulada." />
        <EmptyState
          title="No se pudo abrir el ledger"
          description={describeLedgerRepositoryError(ledger.error)}
        />
        <Button onClick={ledger.retry}>Reintentar</Button>
      </section>
    )
  }

  return <HistoryContent services={ledger.services} />
}

function HistoryContent({ services }: { services: LedgerServices }) {
  const snapshot = useLedgerSnapshot(services)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [pageNumber, setPageNumber] = useState(1)

  if (snapshot.isPending) {
    return (
      <section className="space-y-6">
        <PageHeader title="Historial" description="Todas las operaciones de tu cuenta simulada." />
        <p role="status" className="text-sm text-fg-muted">
          Cargando historial…
        </p>
      </section>
    )
  }

  if (!snapshot.data) {
    return (
      <section className="space-y-6">
        <PageHeader title="Historial" description="Todas las operaciones de tu cuenta simulada." />
        <EmptyState
          title="No se pudo cargar el historial"
          description={describeError(snapshot.error)}
        />
        <Button onClick={() => void snapshot.refetch()}>Reintentar</Button>
      </section>
    )
  }

  const filteredEntries = snapshot.data.entries
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => filter === 'all' || entry.kind === filter)
    .sort((left, right) => right.entry.createdAt - left.entry.createdAt || right.index - left.index)
    .map(({ entry }) => entry)
  const page = paginate(filteredEntries, pageNumber, PAGE_SIZE)

  function selectFilter(nextFilter: HistoryFilter) {
    setFilter(nextFilter)
    setPageNumber(1)
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Historial"
        description="Todas las operaciones de tu cuenta simulada."
        actions={
          <Link to="/portfolio" className="text-sm font-medium text-accent-fg hover:underline">
            Ir a Portfolio
          </Link>
        }
      />

      {snapshot.isFetching ? (
        <p role="status" className="text-sm text-fg-muted">
          Actualizando historial…
        </p>
      ) : null}
      {snapshot.isRefetchError ? (
        <p role="alert" className="text-sm text-warning">
          {describeError(snapshot.error)} Se muestran los últimos datos disponibles.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-lg border border-line p-1"
          role="group"
          aria-label="Filtrar historial"
        >
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={filter === item.id}
              onClick={() => selectFilter(item.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${filter === item.id ? 'bg-raised text-fg' : 'text-fg-muted hover:text-fg'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p role="status" className="text-xs text-fg-muted">
          {page.totalItems === 0
            ? 'Sin operaciones'
            : `Mostrando ${page.from}–${page.to} de ${page.totalItems} operaciones`}
        </p>
      </div>

      {page.totalItems === 0 ? (
        <EmptyState
          title={
            filter === 'all'
              ? 'Aún no hay operaciones'
              : `Aún no hay ${filter === 'buy' ? 'compras' : 'ventas'}`
          }
          description={
            filter === 'all'
              ? 'Abre tu cuenta y tus operaciones aparecerán aquí.'
              : 'Cuando registres una operación de este tipo, aparecerá aquí.'
          }
        />
      ) : (
        <Panel padding="none" className="overflow-x-auto">
          <table className="w-full min-w-208 text-sm">
            <caption className="sr-only">Depósitos, compras y ventas de la cuenta simulada</caption>
            <thead className="border-b border-line text-left text-xs text-fg-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Fecha
                </th>
                <th scope="col" className="px-4 py-3">
                  Tipo
                </th>
                <th scope="col" className="px-4 py-3">
                  Activo
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Cantidad
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Precio
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Comisión
                </th>
                <th scope="col" className="px-4 py-3 text-right">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {page.items.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-fg-muted">
                    {formatTimestamp(entry.createdAt)}
                  </td>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {entryLabel(entry)}
                  </th>
                  <td className="px-4 py-3">{entryAsset(entry)}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {entry.kind === 'deposit' ? '—' : entry.quantity.toString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {entry.kind === 'deposit' ? '—' : formatUsdPrice(entry.price)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {entry.kind === 'deposit' ? '—' : formatMoney(entry.fee)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatMoney(entry.kind === 'deposit' ? entry.amount : entry.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-fg-muted">
          Página {page.page} de {page.totalPages}
        </span>
        <Pagination page={page.page} totalPages={page.totalPages} onPageChange={setPageNumber} />
      </div>
    </section>
  )
}
