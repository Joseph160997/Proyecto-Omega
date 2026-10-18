import { entryFromTrade } from '@/domain/ledger/entries'
import { heldQuantity } from '@/domain/ledger/ledger'
import { evaluateBuy, evaluateSell } from '@/domain/orders/rules'
import { ok } from '@/domain/shared/result'

import type { Clock, NewId } from '@/application/ledger/deps'
import type { TradingPolicy } from '@/application/ledger/policy'
import type {
  LedgerRepository,
  LedgerRepositoryError,
  LedgerSnapshot,
} from '@/application/ledger/ports'
import type { Quote } from '@/domain/market/quote'
import type { OrderSide } from '@/domain/orders/trade'
import type { TradingConditions } from '@/domain/orders/rules'
import type { Quantity } from '@/domain/shared/quantity'
import type { Result } from '@/domain/shared/result'

export interface OrderRequest {
  readonly side: OrderSide
  /** El precio con el que el usuario ve la orden. Las reglas comprueban que no sea viejo. */
  readonly quote: Quote
  readonly quantity: Quantity
}

export interface PlaceOrderDeps {
  readonly repository: LedgerRepository
  readonly policy: TradingPolicy
  readonly now: Clock
  readonly newId: NewId
}

export type PlaceOrder = (
  request: OrderRequest,
) => Promise<Result<LedgerSnapshot, LedgerRepositoryError>>

/**
 * Caso de uso: ejecutar una compra o venta simulada.
 *
 * Toda la decisión ocurre DENTRO de `append`, con el estado que el repositorio lee en ese
 * mismo instante. Así el saldo con el que se valida es el real, aunque otra pestaña haya
 * operado un segundo antes. La orden solo se confirma si ya quedó guardada.
 */
export function createPlaceOrder({ repository, policy, now, newId }: PlaceOrderDeps): PlaceOrder {
  return (request) =>
    repository.append((state) => {
      const conditions: TradingConditions = {
        quote: request.quote,
        now: now(),
        maxQuoteAgeMs: policy.maxQuoteAgeMs,
        feeBps: policy.feeBps,
      }

      const evaluated =
        request.side === 'buy'
          ? evaluateBuy(request.quantity, conditions, state.cash)
          : evaluateSell(request.quantity, conditions, heldQuantity(state, request.quote.assetId))

      return evaluated.ok ? ok(entryFromTrade(newId(), evaluated.value)) : evaluated
    })
}
