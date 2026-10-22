import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { StatusChip } from '@/components/ui/StatusChip'
import { useLedger } from '@/app/providers/LedgerProvider'
import { INITIAL_CASH } from '@/application/ledger/account'
import { notionalValue } from '@/domain/shared/notional'
import { Quantity } from '@/domain/shared/quantity'
import { describeLedgerRepositoryError } from '@/features/account/ledgerErrors'
import {
  LedgerOperationError,
  useLedgerActions,
  useLedgerSnapshot,
} from '@/features/portfolio/ledgerQueries'
import { formatMoney, formatUsdPrice } from '@/lib/format'
import { toast } from '@/stores/toast.store'

import type { FormEvent } from 'react'
import type { LedgerServices } from '@/app/container'
import type { OrderSide } from '@/domain/orders/trade'
import type { MarketQuote } from '@/domain/market/quote'

function describeError(error: unknown): string {
  return error instanceof LedgerOperationError
    ? describeLedgerRepositoryError(error.repositoryError)
    : 'No se pudo completar la operación. Inténtalo de nuevo.'
}

function orderPreview(quantityText: string, quote: MarketQuote, side: OrderSide) {
  const parsed = Quantity.parse(quantityText)
  if (!parsed.ok || parsed.value.isZero()) return undefined

  const notional = notionalValue(parsed.value, quote.price)
  const fee = notional.applyBasisPoints(10)

  return { fee, total: side === 'buy' ? notional.add(fee) : notional.subtract(fee) }
}

export function QuickTrade({ quote }: { quote: MarketQuote }) {
  const ledger = useLedger()

  if (ledger.status === 'loading') {
    return (
      <Panel as="section" className="space-y-3">
        <QuickTradeHeading />
        <p role="status" className="text-sm text-fg-muted">
          Cargando cuenta…
        </p>
      </Panel>
    )
  }

  if (ledger.status === 'error') {
    return (
      <Panel as="section" className="space-y-3">
        <QuickTradeHeading />
        <p role="alert" className="text-sm text-warning">
          {describeLedgerRepositoryError(ledger.error)}
        </p>
        <Button onClick={ledger.retry}>Reintentar conexión</Button>
      </Panel>
    )
  }

  return <QuickTradeForm quote={quote} services={ledger.services} />
}

function QuickTradeForm({ quote, services }: { quote: MarketQuote; services: LedgerServices }) {
  const [side, setSide] = useState<OrderSide>('buy')
  const [quantity, setQuantity] = useState('')
  const snapshot = useLedgerSnapshot(services)
  const { openAccount: openAccountAction, placeOrder } = useLedgerActions(services)
  const state = snapshot.data?.state
  const preview = orderPreview(quantity, quote, side)
  const parsedQuantity = Quantity.parse(quantity)
  const quantityIsValid = parsedQuantity.ok && !parsedQuantity.value.isZero()
  const operationError = placeOrder.error ?? openAccountAction.error

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsed = Quantity.parse(quantity)
    if (!parsed.ok) return

    try {
      const updated = await placeOrder.mutateAsync({ side, quote, quantity: parsed.value })
      const entry = updated.entries[updated.entries.length - 1]

      if (entry && entry.kind !== 'deposit') {
        toast.success({
          title: entry.kind === 'buy' ? 'Compra completada' : 'Venta completada',
          description: `${entry.quantity.toString()} ${quote.symbol.toUpperCase()} · total ${formatMoney(entry.total)}`,
        })
      }

      setQuantity('')
    } catch {
      // La mutation conserva el error y el borrador de la orden.
    }
  }

  async function handleOpenAccount() {
    try {
      await openAccountAction.mutateAsync(undefined)
    } catch {
      // La mutation conserva el error para mostrarlo.
    }
  }

  if (snapshot.isPending) {
    return (
      <Panel as="section" className="space-y-3">
        <QuickTradeHeading />
        <p role="status" className="text-sm text-fg-muted">
          Cargando saldo…
        </p>
      </Panel>
    )
  }

  if (!state && snapshot.error) {
    return (
      <Panel as="section" className="space-y-3">
        <QuickTradeHeading />
        <p role="alert" className="text-sm text-warning">
          {describeError(snapshot.error)}
        </p>
        <Button onClick={() => void snapshot.refetch()}>Reintentar lectura</Button>
      </Panel>
    )
  }

  return (
    <Panel as="section" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-fg">Operar</h2>
          <p className="mt-1 text-sm text-fg-muted">Precio actual: {formatUsdPrice(quote.price)}</p>
        </div>
        {state?.entryCount ? (
          <p className="text-sm text-fg-muted">Efectivo: {formatMoney(state.cash)}</p>
        ) : null}
      </div>

      {operationError ? (
        <p role="alert" className="text-sm text-warning">
          {describeError(operationError)}
        </p>
      ) : null}
      {snapshot.error ? (
        <p role="alert" className="text-sm text-warning">
          {describeError(snapshot.error)}
        </p>
      ) : null}
      {!services.persistent ? (
        <StatusChip tone="warn">Los cambios se perderán al cerrar esta pestaña.</StatusChip>
      ) : null}

      {!state?.entryCount ? (
        <div className="space-y-3">
          <p className="text-sm text-fg-muted">
            Abre una cuenta simulada con {formatMoney(INITIAL_CASH)} para operar.
          </p>
          <Button
            variant="primary"
            onClick={handleOpenAccount}
            loading={openAccountAction.isPending}
          >
            Abrir cuenta simulada
          </Button>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={submitOrder}>
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

          <label className="block space-y-2 text-sm font-medium text-fg">
            Cantidad de {quote.symbol.toUpperCase()}
            <input
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              aria-invalid={quantity !== '' && !quantityIsValid}
              className="block min-h-10 w-full rounded-lg border border-line bg-panel px-3 font-mono text-sm"
              required
            />
          </label>

          {side === 'sell' && state.positions.get(quote.assetId) ? (
            <p className="text-xs text-fg-muted">
              Disponible: {state.positions.get(quote.assetId)?.quantity.toString()}
            </p>
          ) : null}

          <dl className="space-y-1 text-sm text-fg-muted">
            <div className="flex justify-between gap-3">
              <dt>Comisión estimada</dt>
              <dd>{preview ? formatMoney(preview.fee) : '—'}</dd>
            </div>
            <div className="flex justify-between gap-3 font-medium text-fg">
              <dt>{side === 'buy' ? 'Total estimado' : 'Recibirías'}</dt>
              <dd>{preview ? formatMoney(preview.total) : '—'}</dd>
            </div>
          </dl>

          <Button
            type="submit"
            variant="primary"
            loading={placeOrder.isPending}
            disabled={!quantityIsValid}
            className="w-full"
          >
            {side === 'buy' ? 'Confirmar compra' : 'Confirmar venta'}
          </Button>
        </form>
      )}
    </Panel>
  )
}

function QuickTradeHeading() {
  return <h2 className="text-lg font-semibold text-fg">Operar</h2>
}
