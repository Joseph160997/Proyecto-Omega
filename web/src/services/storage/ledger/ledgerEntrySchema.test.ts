import { describe, expect, it } from 'vitest'

import { Money } from '@/domain/shared/money'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'
import { BTC, buy, deposit, sell, T0 } from '@/test-utils/makeEntries'

import { decodeEntry, encodeEntry, ENTRY_FORMAT_VERSION } from './ledgerEntrySchema'

const validDepositRecord = () => ({
  v: ENTRY_FORMAT_VERSION,
  kind: 'deposit',
  id: 'd1',
  amount: '100.00',
  createdAt: T0,
})

const validTradeRecord = () => ({
  v: ENTRY_FORMAT_VERSION,
  kind: 'buy',
  id: 'b1',
  assetId: BTC,
  quantity: '0.1',
  price: '50000',
  notional: '5000.00',
  fee: '5.00',
  total: '5005.00',
  createdAt: T0,
})

function expectInvalidRecord(raw: unknown): string[] {
  const result = decodeEntry(raw)

  expect(result.ok).toBe(false)

  if (result.ok) throw new Error('Expected an invalid ledger entry')

  expect(result.error.kind).toBe('INVALID_RECORD')

  return result.error.issues
}

describe('ledger entry record format', () => {
  it('starts at format version 1', () => {
    expect(ENTRY_FORMAT_VERSION).toBe(1)
  })

  it('encodes and decodes a deposit with canonical money text', () => {
    const entry = deposit('d1', '100.00')
    const encoded = encodeEntry(entry)

    expect(encoded).toEqual({
      v: ENTRY_FORMAT_VERSION,
      kind: 'deposit',
      id: 'd1',
      amount: '100.00',
      createdAt: T0,
    })

    const decoded = decodeEntry(encoded)

    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return

    expect(decoded.value).toMatchObject({ kind: 'deposit', id: 'd1', createdAt: T0 })
    if (decoded.value.kind === 'deposit') {
      expect(decoded.value.amount).toBeInstanceOf(Money)
      expect(decoded.value.amount.toString()).toBe('100.00')
    }
  })

  it.each([
    deposit('d-json', '125.00'),
    buy('b-json', BTC, '0.1', '50000'),
    sell('s-json', BTC, '0.1', '50000'),
  ])('survives an encode → JSON → decode → encode round-trip', (entry) => {
    const encoded = encodeEntry(entry)
    const persisted = JSON.parse(JSON.stringify(encoded)) as unknown
    const decoded = decodeEntry(persisted)

    expect(decoded.ok).toBe(true)
    if (decoded.ok) expect(encodeEntry(decoded.value)).toEqual(encoded)
  })

  it.each([
    ['buy', buy('b1', BTC, '0.1', '50000'), '5005.00'],
    ['sell', sell('s1', BTC, '0.1', '50000'), '4995.00'],
  ])('round-trips a %s trade and rehydrates value objects', (kind, entry, expectedTotal) => {
    const encoded = encodeEntry(entry)
    const decoded = decodeEntry(encoded)

    expect(encoded).toMatchObject({
      v: ENTRY_FORMAT_VERSION,
      kind,
      assetId: BTC,
      quantity: '0.1',
      price: '50000',
      notional: '5000.00',
      fee: '5.00',
      total: expectedTotal,
      createdAt: T0,
    })
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return

    expect(decoded.value.kind).toBe(kind)
    if (decoded.value.kind === 'buy' || decoded.value.kind === 'sell') {
      expect(decoded.value.quantity).toBeInstanceOf(Quantity)
      expect(decoded.value.price).toBeInstanceOf(Price)
      expect(decoded.value.notional).toBeInstanceOf(Money)
      expect(decoded.value.fee).toBeInstanceOf(Money)
      expect(decoded.value.total).toBeInstanceOf(Money)
      expect(decoded.value.quantity.toString()).toBe('0.1')
      expect(decoded.value.price.toString()).toBe('50000')
      expect(decoded.value.notional.toString()).toBe('5000.00')
      expect(decoded.value.fee.toString()).toBe('5.00')
      expect(decoded.value.total.toString()).toBe(expectedTotal)
    }
  })

  it('rejects null, primitives, arrays, and records with unknown variants', () => {
    const invalidValues: unknown[] = [null, undefined, 42, 'deposit', [], {}]

    invalidValues.forEach((value) => {
      expect(expectInvalidRecord(value)).not.toHaveLength(0)
    })
  })

  it('rejects unsupported format versions and unknown entry kinds', () => {
    expect(expectInvalidRecord({ ...validDepositRecord(), v: 2 })).not.toHaveLength(0)
    const { v: _version, ...withoutVersion } = validDepositRecord()
    expect(expectInvalidRecord(withoutVersion)).not.toHaveLength(0)
    expect(expectInvalidRecord({ ...validDepositRecord(), kind: 'withdrawal' })).not.toHaveLength(0)
    expect(expectInvalidRecord({ ...validTradeRecord(), kind: 'gift' })).not.toHaveLength(0)
  })

  it('rejects extra keys instead of silently accepting untrusted data', () => {
    expect(expectInvalidRecord({ ...validDepositRecord(), unexpected: 'value' })).not.toHaveLength(
      0,
    )
    expect(expectInvalidRecord({ ...validTradeRecord(), debug: true })).not.toHaveLength(0)
    expect(expectInvalidRecord({ ...validDepositRecord(), fee: '0.00' })).not.toHaveLength(0)
  })
})

describe('deposit record validation', () => {
  it.each(['', 'has spaces', 'x'.repeat(65), 'id/with/slash', 'bad;id'])(
    'rejects invalid ids: %j',
    (id) => {
      expect(expectInvalidRecord({ ...validDepositRecord(), id })).not.toHaveLength(0)
    },
  )

  it.each([
    ['before the supported range', 946_684_799_999],
    ['far before the supported range', 5],
    ['after the supported range', 4_102_444_800_001],
    ['far after the supported range', 9e12],
    ['a fractional timestamp', T0 + 0.5],
    ['a string timestamp', String(T0)],
  ])('rejects timestamps %s', (_description, createdAt) => {
    expect(expectInvalidRecord({ ...validDepositRecord(), createdAt })).not.toHaveLength(0)
  })

  it.each([
    ['5005', 'non-canonical integer money'],
    [' 5005.00', 'leading whitespace'],
    ['5005.000', 'too many decimal places'],
    ['-1.00', 'negative money'],
    [5005, 'numeric money instead of text'],
    ['1e3', 'exponent notation'],
    ['9'.repeat(5000), 'oversized money text'],
  ])('rejects %s when used as %s', (amount) => {
    expect(expectInvalidRecord({ ...validDepositRecord(), amount })).not.toHaveLength(0)
  })

  it('accepts both inclusive timestamp boundaries', () => {
    expect(decodeEntry({ ...validDepositRecord(), createdAt: 946_684_800_000 }).ok).toBe(true)
    expect(decodeEntry({ ...validDepositRecord(), createdAt: 4_102_444_800_000 }).ok).toBe(true)
  })

  it.each(['100', ' 100.00', '100.000', '-1.00', '1e2', 'NaN', ''])(
    'rejects non-canonical or unsafe money text: %j',
    (amount) => {
      expect(expectInvalidRecord({ ...validDepositRecord(), amount })).not.toHaveLength(0)
    },
  )
})

describe('trade record validation', () => {
  it.each([
    'BTC',
    ':bitcoin',
    'Crypto:bitcoin',
    'crypto:',
    'crypto:has spaces',
    'crypto:'.concat('a'.repeat(65)),
  ])('rejects invalid asset ids: %j', (assetId) => {
    expect(expectInvalidRecord({ ...validTradeRecord(), assetId })).not.toHaveLength(0)
  })

  it.each([
    ['quantity', '0.100000000'],
    ['quantity', '-0.1'],
    ['quantity', '0.10'],
    ['price', '50000.0'],
    ['price', '50000.000000000'],
    ['price', '-1'],
    ['price', '50000.00'],
    ['notional', '5000'],
    ['fee', '-5.00'],
    ['total', '5005.001'],
  ])('rejects invalid or non-canonical %s values', (field, value) => {
    const record = { ...validTradeRecord(), [field]: value }

    expect(expectInvalidRecord(record)).not.toHaveLength(0)
  })

  it.each(['deposit', 'trade', 'BUY', ''])('rejects invalid trade discriminants: %j', (kind) => {
    expect(expectInvalidRecord({ ...validTradeRecord(), kind })).not.toHaveLength(0)
  })
})

describe('decodeEntry error summaries', () => {
  it('limits issue count and does not echo untrusted values or key names', () => {
    const secret = 'UNTRUSTED_SECRET_SHOULD_NOT_LEAK'
    const issues = expectInvalidRecord({
      v: 999,
      kind: 'deposit',
      id: secret,
      amount: secret,
      createdAt: secret,
      [secret]: secret,
    })

    expect(issues.length).toBeLessThanOrEqual(5)
    expect(issues.join(' ')).not.toContain(secret)
    issues.forEach((issue) => expect(issue).toMatch(/^[\x20-\x7E]*$/))
    issues.forEach((issue) => expect(issue.length).toBeLessThanOrEqual(200))
  })
})
