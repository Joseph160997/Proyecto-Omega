import type { Money } from '@/domain/shared/money'
import type { Quantity } from '@/domain/shared/quantity'

export type OrderRejection =
  | { kind: 'INVALID_QUANTITY' }
  | { kind: 'INVALID_PRICE' }
  | { kind: 'STALE_QUOTE'; ageMs: number; maxAgeMs: number }
  | { kind: 'ORDER_TOO_SMALL' }
  | { kind: 'INSUFFICIENT_CASH'; required: Money; available: Money }
  | { kind: 'INSUFFICIENT_POSITION'; requested: Quantity; available: Quantity }
