import { notionalValue } from '@/domain/shared/notional'

import type { LedgerState, Position } from '@/domain/ledger/ledger'
import type { MarketQuote } from '@/domain/market/quote'
import type { Money } from '@/domain/shared/money'

export interface ValuedPosition {
  readonly position: Position
  readonly quote?: MarketQuote
  readonly marketValue?: Money
  readonly unrealizedPnl?: Money
}

export interface PortfolioValuation {
  readonly positions: readonly ValuedPosition[]
  /** No se publica un total engañoso si alguna posición carece de cotización. */
  readonly totalValue?: Money
  readonly unrealizedPnl?: Money
}

export function valuePortfolio(
  state: LedgerState,
  quotes: readonly MarketQuote[],
): PortfolioValuation {
  const quotesByAsset = new Map(quotes.map((quote) => [quote.assetId, quote]))
  const positions = [...state.positions.values()].map((position): ValuedPosition => {
    const quote = quotesByAsset.get(position.assetId)

    if (!quote) return { position }

    const marketValue = notionalValue(position.quantity, quote.price)

    return {
      position,
      quote,
      marketValue,
      unrealizedPnl: marketValue.subtract(position.costBasis),
    }
  })

  if (positions.some((position) => position.marketValue === undefined)) return { positions }

  const marketValue = positions.reduce(
    (total, position) => total.add(position.marketValue!),
    state.cash,
  )
  const unrealizedPnl = positions.reduce(
    (total, position) => total.add(position.unrealizedPnl!),
    state.cash.subtract(state.cash),
  )

  return { positions, totalValue: marketValue, unrealizedPnl }
}
