import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { StatusChip } from '@/components/ui/StatusChip'
import { INITIAL_CASH } from '@/application/ledger/account'
import { Quantity } from '@/domain/shared/quantity'
import { notionalValue } from '@/domain/shared/notional'
import { valuePortfolio } from '@/domain/portfolio/valuation'
import { describeLedgerRepositoryError } from '@/features/account/ledgerErrors'
import { describeMarketError } from '@/features/markets/marketErrors'
import { useMarketListing } from '@/features/markets/useMarketListing'
import { toast } from '@/stores/toast.store'
import {
  LedgerOperationError,
  useLedgerActions,
  useLedgerSnapshot,
} from '@/features/portfolio/ledgerQueries'
import { formatMoney, formatUsdPrice } from '@/lib/format'

import type { FormEvent } from 'react'
import type { LedgerServices } from '@/app/container'
import type { OrderSide } from '@/domain/orders/trade'
import type { MarketQuote } from '@/domain/market/quote'
import type { Money } from '@/domain/shared/money'

const GENERIC_OPERATION_ERROR = 'No se pudo completar la operación. Inténtalo de nuevo.'

function errorMessage(error: unknown): string {
  return error instanceof LedgerOperationError
    ? describeLedgerRepositoryError(error.repositoryError)
    : GENERIC_OPERATION_ERROR
}

function previewOrder(
  quantityText: string,
  quote: MarketQuote | undefined,
  side: OrderSide,
): { fee: Money; total: Money } | undefined {
  if (!quote) return undefined

  const parsed = Quantity.parse(quantityText)

  if (!parsed.ok || parsed.value.isZero()) return undefined

  const notional = notionalValue(parsed.value, quote.price)
  const fee = notional.applyBasisPoints(10)

  return { fee, total: side === 'buy' ? notional.add(fee) : notional.subtract(fee) }
}

export function PortfolioWorkspace({ services }: { services: LedgerServices }) {
  const [searchParams] = useSearchParams()
  const [side, setSide] = useState<OrderSide>('buy')
  const [assetId, setAssetId] = useState(searchParams.get('assetId') ?? '')
  const [quantity, setQuantity] = useState('')
  const snapshot = useLedgerSnapshot(services)
  const { openAccount, resetAccount, placeOrder } = useLedgerActions(services)
  const market = useMarketListing()
  const state = snapshot.data?.state
  const quotes = market.data?.quotes ?? []
  const quoteById = new Map(quotes.map((quote) => [quote.assetId, quote]))
  const selectedQuote = quoteById.get(assetId)
  const preview = previewOrder(quantity, selectedQuote, side)
  const requestedAsset = searchParams.get('assetId')

  useEffect(() => {
    if (requestedAsset) setAssetId(requestedAsset)
  }, [requestedAsset])

  if (snapshot.isPending) {
    return (
      <section className="space-y-6">
        <PageHeader title="Portfolio" description="Cuenta simulada, posiciones y operaciones." />
        <p role="status" className="text-sm text-fg-muted">
          Cargando cuenta…
        </p>
      </section>
    )
  }

  if (!state) {
    return (
      <LedgerRecovery
        services={services}
        error={snapshot.error}
        onRetry={() => void snapshot.refetch()}
      />
    )
  }

  const accountIsOpen = state.entryCount > 0
  const valuation = valuePortfolio(state, quotes)
  const totalPnl = valuation.unrealizedPnl
    ? state.realizedPnl.add(valuation.unrealizedPnl)
    : undefined
  const operationError = placeOrder.error ?? openAccount.error ?? resetAccount.error

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Quantity.parse(quantity)

    if (!selectedQuote || !parsed.ok) return

    try {
      const updated = await placeOrder.mutateAsync({
        side,
        quote: selectedQuote,
        quantity: parsed.value,
      })
      const entry = updated.entries[updated.entries.length - 1]

      if (entry && entry.kind !== 'deposit') {
        toast.success({
          title: entry.kind === 'buy' ? 'Compra completada' : 'Venta completada',
          description: `${entry.quantity.toString()} ${selectedQuote.symbol.toUpperCase()} · total ${formatMoney(entry.total)}`,
        })
      }

      setQuantity('')
    } catch {
      // La mutation conserva el error y el borrador de la orden.
    }
  }

  async function openAccountNow() {
    try {
      await openAccount.mutateAsync(undefined)
    } catch {
      // La mutation conserva el error.
    }
  }

  async function resetAccountNow() {
    const confirmed = window.confirm(
      'Se borrarán todas las operaciones y se abrirá una cuenta nueva con $10,000. Esta acción no se puede deshacer. ¿Continuar?',
    )

    if (!confirmed) return

    try {
      await resetAccount.mutateAsync(undefined)
    } catch {
      // La mutation conserva el error.
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Portfolio"
        description="Cuenta simulada, posiciones y operaciones."
        actions={
          accountIsOpen ? (
            <Button size="sm" onClick={resetAccountNow} loading={resetAccount.isPending}>
              Reiniciar cuenta
            </Button>
          ) : undefined
        }
      />

      {!services.persistent ? (
        <div role="status">
          <StatusChip tone="warn">
            Modo temporal: los datos se perderán al cerrar esta pestaña.
          </StatusChip>
        </div>
      ) : null}

      {operationError ? (
        <p role="alert" className="text-sm text-warning">
          {errorMessage(operationError)}
        </p>
      ) : null}
      {snapshot.error ? (
        <p role="alert" className="text-sm text-warning">
          {errorMessage(snapshot.error)}
        </p>
      ) : null}
      {market.error && !market.data ? (
        <p role="status" className="text-sm text-fg-muted">
          {describeMarketError(market.error)}
        </p>
      ) : null}

      {!accountIsOpen ? (
        <Panel as="section" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-fg">Abre tu cuenta simulada</h2>
            <p className="mt-1 text-sm text-fg-muted">
              Empieza con {formatMoney(INITIAL_CASH)} de efectivo virtual.
            </p>
          </div>
          <Button variant="primary" onClick={openAccountNow} loading={openAccount.isPending}>
            Abrir cuenta
          </Button>
        </Panel>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Efectivo" value={formatMoney(state.cash)} />
            <Metric
              label="Valor total"
              value={
                valuation.totalValue ? formatMoney(valuation.totalValue) : 'Precio no disponible'
              }
            />
            <Metric label="P&L realizado" value={formatMoney(state.realizedPnl)} />
            <Metric
              label="P&L total"
              value={
                totalPnl
                  ? formatMoney(totalPnl)
                  : state.positions.size
                    ? 'Precio no disponible'
                    : formatMoney(state.realizedPnl)
              }
            />
          </div>

          <Panel as="section" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-fg">Nueva operación</h2>
              <p className="mt-1 text-sm text-fg-muted">
                Comisión estimada: 0.10%. Saldo, posición y vigencia del precio se validan al
                confirmar.
              </p>
            </div>

            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" onSubmit={submitOrder}>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-fg">Operación</legend>
                <div className="inline-flex rounded-lg border border-line p-1">
                  {(['buy', 'sell'] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={side === value}
                      onClick={() => setSide(value)}
                      className={`rounded-md px-4 py-2 text-sm font-medium ${side === value ? 'bg-raised text-fg' : 'text-fg-muted'}`}
                    >
                      {value === 'buy' ? 'Comprar' : 'Vender'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="space-y-2 text-sm font-medium text-fg">
                Activo
                <select
                  value={assetId}
                  onChange={(event) => setAssetId(event.target.value)}
                  disabled={!market.data || quotes.length === 0}
                  className="block min-h-10 w-full rounded-lg border border-line bg-panel px-3 text-sm text-fg"
                  required
                >
                  <option value="" disabled>
                    Selecciona un activo
                  </option>
                  {quotes.map((quote) => (
                    <option key={quote.assetId} value={quote.assetId}>
                      {quote.name} ({quote.symbol.toUpperCase()})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-fg">
                Cantidad
                <input
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                  placeholder="0.00"
                  className="block min-h-10 w-full rounded-lg border border-line bg-panel px-3 font-mono text-sm text-fg"
                  required
                  aria-invalid={quantity !== '' && !Quantity.parse(quantity).ok}
                />
                {side === 'sell' && selectedQuote ? (
                  <span className="block text-xs font-normal text-fg-muted">
                    Disponible:{' '}
                    {state.positions.get(selectedQuote.assetId)?.quantity.toString() ?? '0'}
                  </span>
                ) : null}
              </label>

              <div className="space-y-2 text-sm">
                <p className="font-medium text-fg">Estimación</p>
                {selectedQuote ? (
                  <dl className="space-y-1 text-fg-muted">
                    <div className="flex justify-between gap-3">
                      <dt>Precio</dt>
                      <dd>{formatUsdPrice(selectedQuote.price)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Comisión</dt>
                      <dd>{preview ? formatMoney(preview.fee) : '—'}</dd>
                    </div>
                    <div className="flex justify-between gap-3 font-medium text-fg">
                      <dt>{side === 'buy' ? 'Total estimado' : 'Recibirías'}</dt>
                      <dd>{preview ? formatMoney(preview.total) : '—'}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-fg-muted">Cotización no disponible.</p>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  loading={placeOrder.isPending}
                  disabled={!selectedQuote || !Quantity.parse(quantity).ok}
                  className="w-full"
                >
                  {side === 'buy' ? 'Confirmar compra' : 'Confirmar venta'}
                </Button>
              </div>
            </form>
          </Panel>

          <section className="space-y-3" aria-labelledby="positions-heading">
            <h2 id="positions-heading" className="text-lg font-semibold text-fg">
              Posiciones
            </h2>
            {valuation.positions.length ? (
              <Panel padding="none" className="overflow-x-auto">
                <table className="w-full min-w-160 text-sm">
                  <thead className="border-b border-line text-left text-xs text-fg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        Activo
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Cantidad
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Costo base
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Valor actual
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        P&L no realizado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {valuation.positions.map(({ position, quote, marketValue, unrealizedPnl }) => (
                      <tr key={position.assetId}>
                        <th scope="row" className="px-4 py-3 text-left font-medium">
                          {quote
                            ? `${quote.name} (${quote.symbol.toUpperCase()})`
                            : position.assetId}
                        </th>
                        <td className="px-4 py-3 text-right font-mono">
                          {position.quantity.toString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatMoney(position.costBasis)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {marketValue ? formatMoney(marketValue) : 'Precio no disponible'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {unrealizedPnl ? formatMoney(unrealizedPnl) : 'Precio no disponible'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            ) : (
              <p className="text-sm text-fg-muted">Aún no tienes posiciones abiertas.</p>
            )}
          </section>

          <Link
            to="/history"
            className="inline-flex text-sm font-medium text-accent-fg hover:underline"
          >
            Ver historial completo
          </Link>
        </>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Panel as="article" padding="sm">
      <p className="text-xs text-fg-muted">{label}</p>
      <p className="mt-2 font-mono text-lg font-semibold tabular-nums text-fg">{value}</p>
    </Panel>
  )
}

function LedgerRecovery({
  services,
  error,
  onRetry,
}: {
  services: LedgerServices
  error: unknown
  onRetry: () => void
}) {
  const { resetAccount } = useLedgerActions(services)

  async function resetUnreadableLedger() {
    const confirmed = window.confirm(
      'Los datos actuales se borrarán de forma permanente y se abrirá una cuenta nueva con $10,000. ¿Continuar?',
    )

    if (!confirmed) return

    try {
      await resetAccount.mutateAsync(undefined)
    } catch {
      // La mutation conserva el error para mostrarlo a continuación.
    }
  }

  const resetError = resetAccount.error

  return (
    <section className="space-y-4">
      <PageHeader title="Portfolio" description="No se pudo leer la cuenta guardada." />
      <EmptyState
        title="El ledger no se puede leer"
        description={`${errorMessage(error)} Puedes reintentar la lectura o borrar los datos dañados bajo confirmación.`}
      />
      {resetError ? (
        <p role="alert" className="text-sm text-warning">
          {errorMessage(resetError)}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRetry}>Reintentar lectura</Button>
        <Button variant="primary" onClick={resetUnreadableLedger} loading={resetAccount.isPending}>
          Borrar datos y abrir cuenta nueva
        </Button>
      </div>
    </section>
  )
}
