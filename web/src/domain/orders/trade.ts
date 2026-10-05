import type { Money } from '@/domain/shared/money'
import type { Price } from '@/domain/shared/price'
import type { Quantity } from '@/domain/shared/quantity'

export type OrderSide = 'buy' | 'sell'

export interface Trade {
  readonly side: OrderSide
  readonly assetId: string
  readonly quantity: Quantity
  readonly price: Price
  readonly notional: Money
  readonly fee: Money
  /** Compra: dinero que sale (notional + fee). Venta: dinero que entra (notional − fee). */
  readonly total: Money
  readonly executedAt: number
}
