import { formatAge, formatMoney, formatWait } from '@/lib/format'

import type { EntryRejection, LedgerRepositoryError } from '@/application/ledger/ports'
import type { LedgerError } from '@/domain/ledger/ledger'

function describeRejection(rejection: EntryRejection): string {
  switch (rejection.kind) {
    case 'INVALID_QUANTITY':
      return 'La cantidad debe ser mayor que cero.'
    case 'INVALID_PRICE':
      return 'El precio de este activo no es válido ahora mismo.'
    case 'STALE_QUOTE':
      return `El precio es ${formatAge(rejection.ageMs)} y el máximo para operar es de ${formatWait(rejection.maxAgeMs)}. Actualiza el mercado e inténtalo de nuevo.`
    case 'ORDER_TOO_SMALL':
      return 'La orden es demasiado pequeña: su valor se redondea a $0.00.'
    case 'INSUFFICIENT_CASH':
      return `No tienes efectivo suficiente: la orden necesita ${formatMoney(rejection.required)} y tienes ${formatMoney(rejection.available)}.`
    case 'INSUFFICIENT_POSITION':
      return `No tienes tanta cantidad: intentas vender ${rejection.requested.toString()} y tienes ${rejection.available.toString()}.`
    case 'ACCOUNT_ALREADY_OPEN':
      return 'La cuenta ya está abierta.'
    default: {
      const _exhaustive: never = rejection
      return _exhaustive
    }
  }
}

/**
 * Errores del libro que se escaparon de `decide`: solo ocurren si el libro cambió entre la
 * validación y el guardado, o si hay un bug. El usuario no puede arreglarlos; se le dice
 * qué hacer, no el detalle técnico.
 */
function describeLedgerError(error: LedgerError): string {
  switch (error.kind) {
    case 'DUPLICATE_ENTRY_ID':
    case 'INVALID_DEPOSIT':
    case 'INVALID_TRADE_ENTRY':
    case 'INSUFFICIENT_CASH':
    case 'INSUFFICIENT_POSITION':
      return 'El libro cambió mientras se procesaba la operación. Inténtalo de nuevo.'
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}

export function describeLedgerRepositoryError(error: LedgerRepositoryError): string {
  switch (error.kind) {
    case 'REJECTED':
      return describeRejection(error.rejection)
    case 'LEDGER_ERROR':
      return describeLedgerError(error.error)
    case 'UNAVAILABLE':
      return 'No se pudo acceder al almacenamiento del navegador.'
    case 'QUOTA_EXCEEDED':
      return 'No hay espacio libre en el navegador para guardar la operación.'
    case 'UNSUPPORTED_VERSION':
      return 'Tus datos los creó una versión más nueva de la aplicación. Actualiza la página.'
    case 'CORRUPT_DATA':
      return 'Los datos guardados están dañados y no se pueden leer.'
    case 'TRANSACTION_FAILED':
      return 'No se pudo guardar la operación. Inténtalo de nuevo.'
    case 'INVALID_ENTRY':
      return 'La operación no se pudo guardar de forma segura.'
    case 'LEDGER_FULL':
      return `Se alcanzó el límite de ${error.max} operaciones guardadas.`
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}
