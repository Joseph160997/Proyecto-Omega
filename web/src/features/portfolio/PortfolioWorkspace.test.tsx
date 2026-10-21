// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createOpenAccount, createResetAccount } from '@/application/ledger/account'
import { DEFAULT_TRADING_POLICY } from '@/application/ledger/policy'
import { createPlaceOrder } from '@/application/ledger/placeOrder'
import { Toaster } from '@/components/ui/Toaster'
import { Price } from '@/domain/shared/price'
import { PortfolioWorkspace } from '@/features/portfolio/PortfolioWorkspace'
import { useMarketListing } from '@/features/markets/useMarketListing'
import { createMemoryLedgerRepository } from '@/services/storage/ledger/memoryLedgerRepository'
import { useToastStore } from '@/stores/toast.store'
import { makeQuote } from '@/test-utils/makeQuote'

import type { LedgerServices } from '@/app/container'

vi.mock('@/features/markets/useMarketListing', () => ({
  useMarketListing: vi.fn(),
}))

const quote = makeQuote('bitcoin', {
  assetId: 'crypto:bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  price: Price.of('100'),
  timestamp: Date.now(),
})

afterEach(() => {
  vi.restoreAllMocks()
  useToastStore.setState({ toasts: [] })
})

async function makeServices(): Promise<LedgerServices> {
  const repository = createMemoryLedgerRepository()
  let id = 0
  const deps = { repository, now: () => Date.now(), newId: () => `entry-${++id}` }
  const loaded = await repository.load()

  if (!loaded.ok) throw new Error('Memory repository should load')

  return {
    snapshot: loaded.value,
    persistent: repository.persistent,
    loadSnapshot: () => repository.load(),
    openAccount: createOpenAccount(deps),
    resetAccount: createResetAccount(deps),
    placeOrder: createPlaceOrder({ ...deps, policy: DEFAULT_TRADING_POLICY }),
  }
}

function renderPortfolio(services: LedgerServices) {
  vi.mocked(useMarketListing).mockReturnValue({
    data: { quotes: [quote], skipped: 0 },
    error: null,
    isPending: false,
  } as unknown as ReturnType<typeof useMarketListing>)

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [{ path: '/portfolio', element: <PortfolioWorkspace services={services} /> }],
    { initialEntries: ['/portfolio'] },
  )
  const user = userEvent.setup()

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>,
  )

  return { user, queryClient }
}

async function openAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: 'Abrir cuenta' }))
  await screen.findByRole('heading', { name: 'Nueva operación' })
}

function cashValue(value: string) {
  const cashMetric = screen.getByText('Efectivo').closest('article')

  if (!cashMetric) throw new Error('Cash metric article is missing')

  return within(cashMetric).getByText(value)
}

async function selectBitcoinAndEnterQuantity(
  user: ReturnType<typeof userEvent.setup>,
  quantity: string,
) {
  await user.selectOptions(screen.getByLabelText('Activo'), 'crypto:bitcoin')
  await user.type(screen.getByLabelText('Cantidad'), quantity)
}

describe('PortfolioWorkspace integration', () => {
  it('opens the account, places a buy, and shows the operation toast and history link', async () => {
    const services = await makeServices()
    const { user } = renderPortfolio(services)

    await openAccount(user)
    await selectBitcoinAndEnterQuantity(user, '2')
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(await screen.findByText('$9,799.80')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /Bitcoin \(BTC\).*2.*\$200\.20/ })).toBeInTheDocument()
    expect(await screen.findByText('Compra completada')).toBeInTheDocument()
    expect(screen.getByText(/2 BTC · total \$200\.20/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver historial completo' })).toHaveAttribute(
      'href',
      '/history',
    )
    expect(screen.getByLabelText('Cantidad')).toHaveValue('')

    const persisted = await services.loadSnapshot()
    expect(persisted.ok && persisted.value.entries.at(-1)?.kind).toBe('buy')
  })

  it('shows a rejected insufficient-cash order and preserves its quantity draft', async () => {
    const services = await makeServices()
    const { user } = renderPortfolio(services)

    await openAccount(user)
    await selectBitcoinAndEnterQuantity(user, '101')
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes efectivo suficiente')
    expect(screen.queryByText('Compra completada')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Cantidad')).toHaveValue('101')
    expect(cashValue('$10,000.00')).toBeInTheDocument()
  })

  it('keeps the ledger unchanged when reset confirmation is cancelled', async () => {
    const services = await makeServices()
    const { user } = renderPortfolio(services)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    await openAccount(user)
    await user.click(screen.getByRole('button', { name: 'Reiniciar cuenta' }))

    await waitFor(() => expect(confirm).toHaveBeenCalledOnce())
    expect(cashValue('$10,000.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar compra' })).toBeInTheDocument()
  })

  it('resets the ledger and opens a fresh account after confirmation', async () => {
    const services = await makeServices()
    const { user } = renderPortfolio(services)
    vi.spyOn(window, 'confirm').mockReturnValue(true)

    await openAccount(user)
    await user.click(screen.getByRole('button', { name: 'Reiniciar cuenta' }))

    expect(await screen.findByRole('button', { name: 'Reiniciar cuenta' })).toBeInTheDocument()
    expect(cashValue('$10,000.00')).toBeInTheDocument()

    const result = await services.loadSnapshot()

    expect(result.ok && result.value.entries).toHaveLength(1)
    expect(result.ok && result.value.entries[0]?.kind).toBe('deposit')
  })
})
