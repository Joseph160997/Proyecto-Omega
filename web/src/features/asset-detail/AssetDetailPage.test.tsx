// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MarketQuotesUnavailableError } from '@/features/markets/marketQueries'
import {
  CandlesUnavailableError,
  useAssetDetailQueries,
} from '@/features/asset-detail/assetDetailQueries'
import { AssetDetailPage } from '@/features/asset-detail/AssetDetailPage'
import { useLedger } from '@/app/providers/LedgerProvider'
import { Price } from '@/domain/shared/price'
import { makeQuote } from '@/test-utils/makeQuote'

import type { MarketDataError } from '@/application/market/errors'

vi.mock('@/features/asset-detail/assetDetailQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/asset-detail/assetDetailQueries')>()

  return { ...actual, useAssetDetailQueries: vi.fn() }
})

vi.mock('@/features/asset-detail/AssetChart', () => ({
  AssetChart: ({ candles }: { candles: readonly unknown[] }) => (
    <div role="img" aria-label="Gráfico de velas OHLC del activo" data-candles={candles.length} />
  ),
}))

vi.mock('@/app/providers/LedgerProvider', () => ({
  useLedger: vi.fn(() => ({ status: 'loading' })),
}))

const quote = makeQuote('bitcoin', {
  assetId: 'crypto:bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  price: Price.of('100'),
  change24hPercent: 2.5,
})

function makeQueries(
  overrides: {
    quote?: Record<string, unknown>
    candles?: Record<string, unknown>
  } = {},
) {
  const query = {
    data: { quotes: [quote], failures: [] },
    error: null,
    isPending: false,
    refetch: vi.fn(),
    ...overrides.quote,
  }
  const candleQuery = {
    data: [
      {
        time: 1,
        open: Price.of('1'),
        high: Price.of('2'),
        low: Price.of('1'),
        close: Price.of('2'),
      },
    ],
    error: null,
    isPending: false,
    isFetching: false,
    refetch: vi.fn(),
    ...overrides.candles,
  }

  return { quote: query, candles: candleQuery }
}

function renderPage(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path: '/markets/:assetId', element: <AssetDetailPage /> }], {
    initialEntries: [path],
  })
  const user = userEvent.setup()

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { router, user }
}

beforeEach(() => {
  vi.mocked(useLedger).mockReturnValue({ status: 'loading' })
  vi.mocked(useAssetDetailQueries).mockReturnValue(
    makeQueries() as unknown as ReturnType<typeof useAssetDetailQueries>,
  )
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('AssetDetailPage', () => {
  it('rejects an unknown asset id and provides a route back to Markets', () => {
    renderPage('/markets/not-an-asset')

    expect(screen.getByRole('heading', { name: 'Activo no disponible' })).toBeInTheDocument()
    expect(screen.getByText('No se reconoce este activo.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver a Markets' })).toHaveAttribute(
      'href',
      '/markets',
    )
    expect(useAssetDetailQueries).not.toHaveBeenCalled()
  })

  it('shows quote loading state and requests data for the route asset', () => {
    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({ quote: { isPending: true, data: undefined } }) as unknown as ReturnType<
        typeof useAssetDetailQueries
      >,
    )

    renderPage('/markets/crypto%3Abitcoin')

    expect(screen.getByRole('status')).toHaveTextContent('Cargando cotización')
    expect(useAssetDetailQueries).toHaveBeenCalledWith('crypto:bitcoin', '7d')
  })

  it('shows the provider reason and retries when quotes are unavailable', async () => {
    const refetch = vi.fn()
    const reason: MarketDataError = { kind: 'RATE_LIMIT', retryAfterMs: 60_000 }
    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({
        quote: {
          data: undefined,
          error: new MarketQuotesUnavailableError([{ assetId: 'crypto:bitcoin', error: reason }]),
          refetch,
        },
      }) as unknown as ReturnType<typeof useAssetDetailQueries>,
    )
    const { user } = renderPage('/markets/crypto%3Abitcoin')

    expect(screen.getByText('No se pudo cargar la cotización')).toBeInTheDocument()
    expect(screen.getByText(/Vuelve a intentarlo en 1 minuto/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows a fallback when the quote is missing without a provider failure', () => {
    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({ quote: { data: { quotes: [], failures: [] } } }) as unknown as ReturnType<
        typeof useAssetDetailQueries
      >,
    )

    renderPage('/markets/crypto%3Abitcoin')

    expect(screen.getByText('Ocurrió un error inesperado al cargar los datos.')).toBeInTheDocument()
  })

  it('shows available quote data with a stale-refresh warning', () => {
    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({ quote: { error: new Error('refresh failed') } }) as unknown as ReturnType<
        typeof useAssetDetailQueries
      >,
    )

    renderPage('/markets/crypto%3Abitcoin')

    expect(screen.getByRole('heading', { name: 'Bitcoin (BTC)' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'La última cotización no se pudo actualizar',
    )
  })

  it('renders candles, explains an empty history, and retries unavailable history', async () => {
    const { user, router } = renderPage('/markets/crypto%3Abitcoin?timeframe=30d')

    expect(screen.getByRole('img', { name: 'Gráfico de velas OHLC del activo' })).toHaveAttribute(
      'data-candles',
      '1',
    )
    expect(useAssetDetailQueries).toHaveBeenCalledWith('crypto:bitcoin', '30d')

    const refetch = vi.fn()
    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({
        candles: { data: [], error: null },
      }) as unknown as ReturnType<typeof useAssetDetailQueries>,
    )
    await router.navigate('/markets/crypto%3Abitcoin?timeframe=7d')
    expect(
      await screen.findByText('No hay velas disponibles para este periodo.'),
    ).toBeInTheDocument()

    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({
        candles: {
          data: undefined,
          error: new CandlesUnavailableError({ kind: 'NETWORK_ERROR' }),
          refetch,
        },
      }) as unknown as ReturnType<typeof useAssetDetailQueries>,
    )
    await router.navigate('/markets/crypto%3Abitcoin?timeframe=1d')
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el proveedor')
    await user.click(screen.getByRole('button', { name: 'Reintentar historial' }))

    expect(refetch).toHaveBeenCalledOnce()
  })

  it('shows a generic history error and an updating status for background fetches', () => {
    vi.mocked(useAssetDetailQueries).mockReturnValue(
      makeQueries({
        candles: { error: new Error('unexpected'), isFetching: true },
      }) as unknown as ReturnType<typeof useAssetDetailQueries>,
    )

    renderPage('/markets/crypto%3Abitcoin')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Ocurrió un error inesperado al cargar el historial',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Actualizando historial')
  })

  it('toggles the quick trade panel and its accessible close label', async () => {
    const { user } = renderPage('/markets/crypto%3Abitcoin')
    const openButton = screen.getByRole('button', { name: 'Operar' })

    expect(openButton).toHaveAttribute('aria-expanded', 'false')
    expect(openButton).not.toHaveAttribute('aria-controls')
    expect(screen.queryByRole('heading', { name: 'Operar' })).not.toBeInTheDocument()

    await user.click(openButton)

    const closeButton = screen.getByRole('button', { name: 'Cerrar operar' })
    expect(closeButton).toHaveAttribute('aria-expanded', 'true')
    expect(closeButton).toHaveAttribute('aria-controls', 'asset-quick-trade')
    expect(screen.getByText('Cargando cuenta…')).toBeInTheDocument()

    await user.click(closeButton)
    expect(screen.getByRole('button', { name: 'Operar' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('normalizes invalid timeframes with replace while preserving other query params', async () => {
    const { router } = renderPage('/markets/crypto%3Abitcoin?foo=bar&timeframe=invalid')

    await vi.waitFor(() => expect(router.state.location.search).toBe('?foo=bar&timeframe=7d'))
    expect(router.state.historyAction).toBe('REPLACE')
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('changes timeframe in the URL without dropping unrelated parameters', async () => {
    const { router, user } = renderPage('/markets/crypto%3Abitcoin?foo=bar&timeframe=7d')

    await user.click(screen.getByRole('button', { name: '90D' }))

    await vi.waitFor(() => expect(router.state.location.search).toBe('?foo=bar&timeframe=90d'))
    expect(screen.getByRole('button', { name: '90D' })).toHaveAttribute('aria-pressed', 'true')
  })
})
