import { describe, expect, it } from 'vitest'

import { describeLedgerRepositoryError } from '@/features/account/ledgerErrors'
import { Money } from '@/domain/shared/money'
import { Quantity } from '@/domain/shared/quantity'

import type { EntryRejection, LedgerRepositoryError } from '@/application/ledger/ports'
import type { LedgerError } from '@/domain/ledger/ledger'

const rejected = (rejection: EntryRejection): LedgerRepositoryError => ({
  kind: 'REJECTED',
  rejection,
})

const ledgerError = (error: LedgerError): LedgerRepositoryError => ({
  kind: 'LEDGER_ERROR',
  error,
})

const ENTRY_ID = 'secret-entry-42'

const REJECTIONS: ReadonlyArray<[string, LedgerRepositoryError]> = [
  ['INVALID_QUANTITY', rejected({ kind: 'INVALID_QUANTITY' })],
  ['INVALID_PRICE', rejected({ kind: 'INVALID_PRICE' })],
  ['STALE_QUOTE', rejected({ kind: 'STALE_QUOTE', ageMs: 7 * 60_000, maxAgeMs: 5 * 60_000 })],
  ['ORDER_TOO_SMALL', rejected({ kind: 'ORDER_TOO_SMALL' })],
  [
    'INSUFFICIENT_CASH',
    rejected({
      kind: 'INSUFFICIENT_CASH',
      required: Money.usd('5005'),
      available: Money.usd('100'),
    }),
  ],
  [
    'INSUFFICIENT_POSITION',
    rejected({
      kind: 'INSUFFICIENT_POSITION',
      requested: Quantity.of('0.2'),
      available: Quantity.of('0.1'),
    }),
  ],
  ['ACCOUNT_ALREADY_OPEN', rejected({ kind: 'ACCOUNT_ALREADY_OPEN' })],
]

const LEDGER_ERRORS: ReadonlyArray<[string, LedgerRepositoryError]> = [
  ['DUPLICATE_ENTRY_ID', ledgerError({ kind: 'DUPLICATE_ENTRY_ID', entryId: ENTRY_ID })],
  ['INVALID_DEPOSIT', ledgerError({ kind: 'INVALID_DEPOSIT', entryId: ENTRY_ID })],
  ['INVALID_TRADE_ENTRY', ledgerError({ kind: 'INVALID_TRADE_ENTRY', entryId: ENTRY_ID })],
  [
    'INSUFFICIENT_CASH',
    ledgerError({
      kind: 'INSUFFICIENT_CASH',
      entryId: ENTRY_ID,
      required: Money.usd('5005'),
      available: Money.usd('100'),
    }),
  ],
  [
    'INSUFFICIENT_POSITION',
    ledgerError({
      kind: 'INSUFFICIENT_POSITION',
      entryId: ENTRY_ID,
      assetId: 'crypto:bitcoin',
      requested: Quantity.of('0.2'),
      available: Quantity.of('0.1'),
    }),
  ],
]

const STORAGE_ERRORS: ReadonlyArray<[string, LedgerRepositoryError]> = [
  ['UNAVAILABLE', { kind: 'UNAVAILABLE' }],
  ['QUOTA_EXCEEDED', { kind: 'QUOTA_EXCEEDED' }],
  ['UNSUPPORTED_VERSION', { kind: 'UNSUPPORTED_VERSION', found: 99 }],
  ['CORRUPT_DATA', { kind: 'CORRUPT_DATA', index: 3, issues: ['amount: invalid'] }],
  ['TRANSACTION_FAILED', { kind: 'TRANSACTION_FAILED' }],
  ['INVALID_ENTRY', { kind: 'INVALID_ENTRY', issues: ['price: invalid'] }],
  ['LEDGER_FULL', { kind: 'LEDGER_FULL', max: 50_000 }],
]

describe('describeLedgerRepositoryError', () => {
  describe.each([
    ['rejection', REJECTIONS],
    ['ledger error', LEDGER_ERRORS],
    ['storage error', STORAGE_ERRORS],
  ])('formats %s messages', (_group, cases) => {
    it.each(cases)(
      '%s: contains more than 15 characters and ends with a period',
      (_kind, error) => {
        // Arrange: the case is defined in the table

        // Act
        const message = describeLedgerRepositoryError(error)

        // Assert
        expect(message.length).toBeGreaterThan(15)
        expect(message.endsWith('.')).toBe(true)
      },
    )
  })

  describe('distinct messages', () => {
    it.each([
      ['rejections', REJECTIONS],
      ['storage errors', STORAGE_ERRORS],
    ])('%s', (_group, cases) => {
      // Arrange
      const errors = cases.map(([, error]) => error)

      // Act
      const messages = errors.map(describeLedgerRepositoryError)

      // Assert
      expect(new Set(messages).size).toBe(cases.length)
    })
  })

  describe('complete messages', () => {
    it('INSUFFICIENT_CASH includes the required and available amounts', () => {
      // Arrange
      const error = REJECTIONS.find(([kind]) => kind === 'INSUFFICIENT_CASH')![1]

      // Act
      const message = describeLedgerRepositoryError(error)

      // Assert
      expect(message).toBe(
        'No tienes efectivo suficiente: la orden necesita $5,005.00 y tienes $100.00.',
      )
    })

    it('INSUFFICIENT_POSITION includes the requested and available quantities', () => {
      // Arrange
      const error = REJECTIONS.find(([kind]) => kind === 'INSUFFICIENT_POSITION')![1]

      // Act
      const message = describeLedgerRepositoryError(error)

      // Assert
      expect(message).toBe('No tienes tanta cantidad: intentas vender 0.2 y tienes 0.1.')
    })

    it('STALE_QUOTE includes the quote age and maximum allowed age', () => {
      // Arrange
      const error = REJECTIONS.find(([kind]) => kind === 'STALE_QUOTE')![1]

      // Act
      const message = describeLedgerRepositoryError(error)

      // Assert
      expect(message).toContain('hace 7 min')
      expect(message).toContain('máximo para operar es de 5 minutos')
      expect(message).toContain('Actualiza el mercado e inténtalo de nuevo.')
    })

    it('LEDGER_FULL includes the limit', () => {
      // Arrange
      const error: LedgerRepositoryError = { kind: 'LEDGER_FULL', max: 50_000 }

      // Act
      const message = describeLedgerRepositoryError(error)

      // Assert
      expect(message).toBe('Se alcanzó el límite de 50000 operaciones guardadas.')
    })

    it('ACCOUNT_ALREADY_OPEN indicates that the account is already open', () => {
      // Arrange
      const error = rejected({ kind: 'ACCOUNT_ALREADY_OPEN' })

      // Act
      const message = describeLedgerRepositoryError(error)

      // Assert
      expect(message).toBe('La cuenta ya está abierta.')
    })
  })

  describe('internal ledger errors', () => {
    it.each(LEDGER_ERRORS)('%s does not expose entryId or technical names', (_kind, error) => {
      // Arrange
      const technicalNames = /entryId|DUPLICATE|INVALID|INSUFFICIENT|crypto:|secret-entry/i

      // Act
      const message = describeLedgerRepositoryError(error)

      // Assert
      expect(message).not.toMatch(technicalNames)
      expect(message).toBe(
        'El libro cambió mientras se procesaba la operación. Inténtalo de nuevo.',
      )
    })
  })
})
