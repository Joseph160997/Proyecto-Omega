import type { MarketQuote } from '@/domain/market/quote'

export type SortKey = 'name' | 'price' | 'change24h' | 'marketCap' | 'volume24h'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  readonly key: SortKey
  readonly direction: SortDirection
}

export const DEFAULT_SORT: SortState = { key: 'marketCap', direction: 'desc' }
export const MARKET_PAGE_SIZE = 50

const FIRST_DIRECTION: Record<SortKey, SortDirection> = {
  name: 'asc',
  price: 'desc',
  change24h: 'desc',
  marketCap: 'desc',
  volume24h: 'desc',
}

/** Returns the sort state produced by clicking a column. */
export function nextSort(current: SortState, key: SortKey): SortState {
  if (current.key === key) {
    return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
  }

  return { key, direction: FIRST_DIRECTION[key] }
}

export function filterQuotes(quotes: readonly MarketQuote[], rawQuery: string): MarketQuote[] {
  const query = rawQuery.trim().toLowerCase()

  if (query === '') return [...quotes]

  return quotes.filter(
    (quote) =>
      quote.name.toLowerCase().includes(query) || quote.symbol.toLowerCase().includes(query),
  )
}

interface Column {
  readonly hasValue: (quote: MarketQuote) => boolean
  readonly compare: (a: MarketQuote, b: MarketQuote) => number
}

function numericColumn(read: (quote: MarketQuote) => number | undefined): Column {
  return {
    hasValue: (quote) => read(quote) !== undefined,
    compare: (a, b) => (read(a) ?? 0) - (read(b) ?? 0),
  }
}

const COLUMNS: Record<SortKey, Column> = {
  name: {
    hasValue: () => true,
    compare: (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }),
  },
  price: {
    hasValue: () => true,
    compare: (a, b) => a.price.compareTo(b.price),
  },
  change24h: numericColumn((quote) => quote.change24hPercent),
  marketCap: numericColumn((quote) => quote.marketCap),
  volume24h: numericColumn((quote) => quote.volume24h),
}

function compareIds(a: MarketQuote, b: MarketQuote): number {
  if (a.assetId < b.assetId) return -1

  return a.assetId > b.assetId ? 1 : 0
}

/** Returns a sorted copy and never mutates the input array. */
export function sortQuotes(quotes: readonly MarketQuote[], sort: SortState): MarketQuote[] {
  const column = COLUMNS[sort.key]
  const sign = sort.direction === 'asc' ? 1 : -1

  return [...quotes].sort((a, b) => {
    const aHasValue = column.hasValue(a)
    const bHasValue = column.hasValue(b)

    if (aHasValue !== bHasValue) return aHasValue ? -1 : 1

    const byColumn = aHasValue ? sign * column.compare(a, b) : 0

    return byColumn !== 0 ? byColumn : compareIds(a, b)
  })
}
