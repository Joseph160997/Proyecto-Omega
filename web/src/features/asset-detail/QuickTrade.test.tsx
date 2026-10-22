// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createOpenAccount, createResetAccount } from '@/application/ledger/account'
import { DEFAULT_TRADING_POLICY } from '@/application/ledger/policy'
import { createPlaceOrder } from '@/application/ledger/placeOrder'
import { Toaster } from '@/components/ui/Toaster'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'
import { QuickTrade } from '@/features/asset-detail/QuickTrade'
import { useLedger } from '@/app/providers/LedgerProvider'
import { createMemoryLedgerRepository } from '@/services/storage/ledger/memoryLedgerRepository'
import { useToastStore } from '@/stores/toast.store'
import { makeQuote } from '@/test-utils/makeQuote'

import type { LedgerServices } from '@/app/container'
import type { MarketQuote } from '@/domain/market/quote'

vi.mock('@/app/providers/LedgerProvider', () => ({ useLedger: vi.fn() }))

const quote: MarketQuote = makeQuote('bitcoin', {
  assetId: 'crypto:bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  price: Price.of('100'),
  timestamp: Date.now(),
})

afterEach(() => {
  vi.clearAllMocks()
  useToastStore.setState({ toasts: [] })
})

async function makeServices(overrides: Partial<LedgerServices> = {}): Promise<LedgerServices> {
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
    ...overrides,
  }
}

function renderTrade(services: LedgerServices) {
  vi.mocked(useLedger).mockReturnValue({ status: 'ready', services })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const user = userEvent.setup()

  render(
    <QueryClientProvider client={queryClient}>
      <QuickTrade quote={quote} />
      <Toaster />
    </QueryClientProvider>,
  )

  return { user }
}

async function openAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Abrir cuenta simulada' }))
  await screen.findByRole('button', { name: 'Confirmar compra' })
}

describe('QuickTrade', () => {
  it('shows the loading and connection-error states from LedgerProvider', () => {
    vi.mocked(useLedger).mockReturnValue({ status: 'loading' })
    const queryClient = new QueryClient()
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <QuickTrade quote={quote} />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Cargando cuenta')

    const retry = vi.fn()
    vi.mocked(useLedger).mockReturnValue({
      status: 'error',
      error: { kind: 'UNAVAILABLE' },
      retry,
    })
    rerender(
      <QueryClientProvider client={queryClient}>
        <QuickTrade quote={quote} />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo acceder al almacenamiento')
    expect(screen.getByRole('button', { name: 'Reintentar conexión' })).toBeInTheDocument()
  })

  it('offers a simulated account with initial cash and warns when storage is in memory', async () => {
    const services = await makeServices()
    const { user } = renderTrade(services)

    expect(
      screen.getByText('Abre una cuenta simulada con $10,000.00 para operar.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Los cambios se perderán al cerrar esta pestaña.')).toBeInTheDocument()

    await openAccount(user)

    expect(screen.getByText('Efectivo: $10,000.00')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comprar' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens account failures without losing the account-opening action', async () => {
    const services = await makeServices({
      openAccount: async () => ({ ok: false, error: { kind: 'UNAVAILABLE' } }),
    })
    const { user } = renderTrade(services)

    await user.click(screen.getByRole('button', { name: 'Abrir cuenta simulada' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo acceder al almacenamiento',
    )
    expect(screen.getByRole('button', { name: 'Abrir cuenta simulada' })).toBeInTheDocument()
  })

  it('previews a buy, submits it, clears the draft, and shows a success toast', async () => {
    const services = await makeServices()
    const { user } = renderTrade(services)
    await openAccount(user)

    const quantity = screen.getByRole('textbox', { name: 'Cantidad de BTC' })
    await user.type(quantity, '2')

    expect(screen.getByText('$0.20')).toBeInTheDocument()
    expect(screen.getByText('$200.20')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(await screen.findByText('Compra completada')).toBeInTheDocument()
    expect(screen.getByText(/2 BTC · total \$200\.20/)).toBeInTheDocument()
    expect(quantity).toHaveValue('')
    expect(screen.getByText('Efectivo: $9,799.80')).toBeInTheDocument()

    const saved = await services.loadSnapshot()
    expect(saved.ok && saved.value.entries.at(-1)?.kind).toBe('buy')
  })

  it('previews and submits a sale, showing available position and proceeds', async () => {
    const services = await makeServices()
    const opened = await services.openAccount()
    if (!opened.ok) throw new Error('Account should open')
    const parsedQuantity = Quantity.parse('2')
    if (!parsedQuantity.ok) throw new Error('Seed quantity should be valid')
    const bought = await services.placeOrder({ side: 'buy', quote, quantity: parsedQuantity.value })
    if (!bought.ok) throw new Error('Seed buy should succeed')

    const { user } = renderTrade({ ...services, snapshot: bought.value })
    await user.click(screen.getByRole('button', { name: 'Vender' }))
    expect(screen.getByText('Disponible: 2')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Cantidad de BTC' }), '1')
    expect(screen.getByText('$0.10')).toBeInTheDocument()
    expect(screen.getByText('$99.90')).toBeInTheDocument()
    expect(screen.getByText('Recibirías')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }))

    expect(await screen.findByText('Venta completada')).toBeInTheDocument()
    expect(screen.getByText(/1 BTC · total \$99\.90/)).toBeInTheDocument()
    expect(screen.getByText('Disponible: 1')).toBeInTheDocument()
  })

  it('keeps invalid quantity disabled and reports an invalid draft', async () => {
    const services = await makeServices()
    const { user } = renderTrade(services)
    await openAccount(user)

    const quantity = screen.getByRole('textbox', { name: 'Cantidad de BTC' })
    const submit = screen.getByRole('button', { name: 'Confirmar compra' })

    expect(submit).toBeDisabled()
    await user.type(quantity, '0')
    expect(quantity).toHaveAttribute('aria-invalid', 'true')
    expect(submit).toBeDisabled()
    await user.clear(quantity)
    await user.type(quantity, 'abc')
    expect(quantity).toHaveAttribute('aria-invalid', 'true')
    expect(submit).toBeDisabled()
  })

  it('preserves a rejected order draft and leaves cash unchanged', async () => {
    const services = await makeServices()
    const { user } = renderTrade(services)
    await openAccount(user)
    const quantity = screen.getByRole('textbox', { name: 'Cantidad de BTC' })
    await user.type(quantity, '101')
    await user.click(screen.getByRole('button', { name: 'Confirmar compra' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes efectivo suficiente')
    expect(quantity).toHaveValue('101')
    expect(screen.getByText('Efectivo: $10,000.00')).toBeInTheDocument()
    expect(screen.queryByText('Compra completada')).not.toBeInTheDocument()
  })

  it('reports rejected sales without a sufficient position and keeps their draft', async () => {
    const services = await makeServices()
    const { user } = renderTrade(services)
    await openAccount(user)
    await user.click(screen.getByRole('button', { name: 'Vender' }))
    const quantity = screen.getByRole('textbox', { name: 'Cantidad de BTC' })
    await user.type(quantity, '1')
    await user.click(screen.getByRole('button', { name: 'Confirmar venta' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes tanta cantidad')
    expect(quantity).toHaveValue('1')
    expect(screen.queryByText('Venta completada')).not.toBeInTheDocument()
  })

  it('offers to retry when the ledger snapshot cannot be read', async () => {
    const retryError = { kind: 'TRANSACTION_FAILED' } as const
    const loadSnapshot = vi.fn(async () => ({ ok: false, error: retryError }) as const)
    const services = await makeServices({
      snapshot: undefined,
      loadSnapshot,
    })
    const { user } = renderTrade(services)

    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo guardar la operación')
    await user.click(screen.getByRole('button', { name: 'Reintentar lectura' }))
    await waitFor(() => expect(loadSnapshot).toHaveBeenCalledTimes(2))
  })

  it('does not show the in-memory warning for persistent storage', async () => {
    const services = await makeServices({ persistent: true })
    renderTrade(services)

    expect(
      screen.queryByText('Los cambios se perderán al cerrar esta pestaña.'),
    ).not.toBeInTheDocument()
  })
})
