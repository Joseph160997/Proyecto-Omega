import { Money } from '@/domain/shared/money'
import { notionalValue } from '@/domain/shared/notional'
import { unitCost } from '@/domain/shared/prorate'

import type { LedgerState, Position } from '@/domain/ledger/ledger'
import type { Price } from '@/domain/shared/price'
import type { Quantity } from '@/domain/shared/quantity'

export interface PositionValuation {
  readonly assetId: string
  readonly quantity: Quantity
  readonly costBasis: Money
  readonly averageCost: Price
  readonly price: Price
  readonly value: Money
  readonly unrealizedPnl: Money
}

export interface PortfolioValuation {
  readonly cash: Money
  /** Valor de las posiciones que tienen precio. */
  readonly positionsValue: Money
  /** Efectivo + posiciones con precio. Si `unpriced` no está vacío, está subestimado. */
  readonly totalValue: Money
  readonly unrealizedPnl: Money
  readonly realizedPnl: Money
  readonly positions: readonly PositionValuation[]
  /** Posiciones sin precio disponible: no se valoran (no se inventa un valor). */
  readonly unpriced: readonly string[]
}

export function averageCost(position: Position): Price {
  return unitCost(position.costBasis, position.quantity)
}

/**
 * Valora el portafolio con precios actuales. `priceOf` decide qué precio se usa (y devuelve
 * undefined si no hay uno fiable, por ejemplo uno demasiado viejo).
 * El valor sube o baja con el mercado SIN tocar el ledger: se calcula, no se guarda.
 */
export function valuePortfolio(
  state: LedgerState,
  priceOf: (assetId: string) => Price | undefined,
): PortfolioValuation {
  const positions: PositionValuation[] = []
  const unpriced: string[] = []
  let positionsValue = Money.zero()
  let unrealizedPnl = Money.zero()

  const sorted = [...state.positions.values()].sort((a, b) => a.assetId.localeCompare(b.assetId))

  for (const position of sorted) {
    const price = priceOf(position.assetId)

    if (price === undefined) {
      unpriced.push(position.assetId)
      continue
    }

    const value = notionalValue(position.quantity, price)
    const pnl = value.subtract(position.costBasis)

    positionsValue = positionsValue.add(value)
    unrealizedPnl = unrealizedPnl.add(pnl)
    positions.push({
      assetId: position.assetId,
      quantity: position.quantity,
      costBasis: position.costBasis,
      averageCost: averageCost(position),
      price,
      value,
      unrealizedPnl: pnl,
    })
  }

  return {
    cash: state.cash,
    positionsValue,
    totalValue: state.cash.add(positionsValue),
    unrealizedPnl,
    realizedPnl: state.realizedPnl,
    positions,
    unpriced,
  }
}
