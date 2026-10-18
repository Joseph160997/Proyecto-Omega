import { z } from 'zod'

import { Money } from '@/domain/shared/money'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'
import { err, ok } from '@/domain/shared/result'

import type { LedgerEntry } from '@/domain/ledger/entries'
import type { Result } from '@/domain/shared/result'

/** Versión del formato de UN asiento guardado. Si cambia, hay que migrar. */
export const ENTRY_FORMAT_VERSION = 1

const MAX_ISSUES = 5
const MAX_ISSUE_LENGTH = 200

// 2000-01-01 .. 2100-01-01 (ms). Una fecha fuera de ahí es dato corrupto, no una compra real.
const MIN_TIME = 946_684_800_000
const MAX_TIME = 4_102_444_800_000

const id = z.string().regex(/^[\w-]{1,64}$/)
const time = z.number().int().min(MIN_TIME).max(MAX_TIME)
const assetId = z.string().regex(/^[a-z]+:[a-z0-9][a-z0-9._-]{0,63}$/)

/**
 * Un decimal guardado como texto: debe ser válido Y estar en forma canónica
 * ("100.00", no "100" ni " 100.00"), así leer y volver a escribir da el mismo texto.
 */
function decimalText<T extends { toString(): string }>(
  parse: (text: string) => Result<T, unknown>,
  label: string,
) {
  return z
    .string()
    .max(64)
    .transform((text, ctx) => {
      const parsed = parse(text)

      if (!parsed.ok || parsed.value.toString() !== text) {
        ctx.addIssue({ code: 'custom', message: label })
        return z.NEVER
      }

      return parsed.value
    })
}

const money = decimalText((text) => Money.parse(text), 'money')
const price = decimalText((text) => Price.parse(text), 'price')
const quantity = decimalText((text) => Quantity.parse(text), 'quantity')

const DepositRecord = z.strictObject({
  v: z.literal(ENTRY_FORMAT_VERSION),
  kind: z.literal('deposit'),
  id,
  amount: money,
  createdAt: time,
})

const TradeRecord = z.strictObject({
  v: z.literal(ENTRY_FORMAT_VERSION),
  kind: z.enum(['buy', 'sell']),
  id,
  assetId,
  quantity,
  price,
  notional: money,
  fee: money,
  total: money,
  createdAt: time,
})

const EntryRecord = z.discriminatedUnion('kind', [DepositRecord, TradeRecord])

export type EntryRecordError = { kind: 'INVALID_RECORD'; issues: string[] }

/**
 * Los mensajes de Zod pueden incluir texto del dato recibido (p. ej. el nombre de una clave
 * sobrante). Aquí solo se conserva DÓNDE falló y el tipo de fallo, acotado en tamaño.
 */
function summarize(error: z.ZodError): string[] {
  return error.issues.slice(0, MAX_ISSUES).map((issue) => {
    const where = issue.path.map(String).join('.') || '(raíz)'

    return `${where}: ${issue.code}`.replace(/[^\x20-\x7E]/g, '?').slice(0, MAX_ISSUE_LENGTH)
  })
}

/** Lo que se escribe en disco. Los valores con decimales van como texto. */
export function encodeEntry(entry: LedgerEntry): unknown {
  if (entry.kind === 'deposit') {
    return {
      v: ENTRY_FORMAT_VERSION,
      kind: 'deposit',
      id: entry.id,
      amount: entry.amount.toString(),
      createdAt: entry.createdAt,
    }
  }

  return {
    v: ENTRY_FORMAT_VERSION,
    kind: entry.kind,
    id: entry.id,
    assetId: entry.assetId,
    quantity: entry.quantity.toString(),
    price: entry.price.toString(),
    notional: entry.notional.toString(),
    fee: entry.fee.toString(),
    total: entry.total.toString(),
    createdAt: entry.createdAt,
  }
}

/** Lo que se lee del disco. Datos no confiables: nada pasa sin validarse. */
export function decodeEntry(raw: unknown): Result<LedgerEntry, EntryRecordError> {
  const parsed = EntryRecord.safeParse(raw)

  if (!parsed.success) return err({ kind: 'INVALID_RECORD', issues: summarize(parsed.error) })

  const record = parsed.data

  if (record.kind === 'deposit') {
    return ok({
      kind: 'deposit',
      id: record.id,
      amount: record.amount,
      createdAt: record.createdAt,
    })
  }

  return ok({
    kind: record.kind,
    id: record.id,
    assetId: record.assetId,
    quantity: record.quantity,
    price: record.price,
    notional: record.notional,
    fee: record.fee,
    total: record.total,
    createdAt: record.createdAt,
  })
}
