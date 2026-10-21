// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { createOpenAccount, createResetAccount } from '@/application/ledger/account'
import { DEFAULT_TRADING_POLICY } from '@/application/ledger/policy'
import { createPlaceOrder } from '@/application/ledger/placeOrder'
import { useLedger } from '@/app/providers/LedgerProvider'
import { err } from '@/domain/shared/result'
import { HistoryPage } from '@/features/history/HistoryPage'
import { createMemoryLedgerRepository } from '@/services/storage/ledger/memoryLedgerRepository'
import { Price } from '@/domain/shared/price'
import { Quantity } from '@/domain/shared/quantity'
import { makeQuote } from '@/test-utils/makeQuote'

import type { LedgerRepositoryError } from '@/application/ledger/ports'
import type { LedgerServices } from '@/app/container'

vi.mock('@/app/providers/LedgerProvider', () => ({
  useLedger: vi.fn(),
}))

const START_TIME = 1_700_000_000_000
const bitcoin = makeQuote('bitcoin', {
  assetId: 'crypto:bitcoin',
  name: 'Bitcoin',
  symbol: 'BTC',
  price: Price.of('100'),
  timestamp: START_TIME,
})

async function makeServices(tradeCount = 2, open = true): Promise<LedgerServices> {
  const repository = createMemoryLedgerRepository()
  let id = 0
  let now = START_TIME
  const deps = {
    repository,
    now: () => now,
    newId: () => `entry-${++id}`,
  }
  const openAccount = createOpenAccount(deps)
  const placeOrder = createPlaceOrder({ ...deps, policy: DEFAULT_TRADING_POLICY })
  if (open) {
    const opened = await openAccount()

    if (!opened.ok) throw new Error('Expected the account to open')
  }

  for (let index = 0; index < tradeCount; index += 1) {
    now += 1_000
    const result = await placeOrder({
      side: index % 2 === 0 ? 'buy' : 'sell',
      quote: bitcoin,
      quantity: Quantity.of('1'),
    })

    if (!result.ok) throw new Error(`Expected trade ${index} to succeed`)
  }

  const loaded = await repository.load()

  if (!loaded.ok) throw new Error('Expected the repository to load')

  return {
    snapshot: loaded.value,
    persistent: repository.persistent,
    loadSnapshot: () => repository.load(),
    openAccount,
    resetAccount: createResetAccount(deps),
    placeOrder,
  }
}

function renderHistory(services: LedgerServices) {
  vi.mocked(useLedger).mockReturnValue({ status: 'ready', services })

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter([{ path: '/history', element: <HistoryPage /> }], {
    initialEntries: ['/history'],
  })
  const user = userEvent.setup()

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )

  return { user }
}

describe('HistoryPage integration', () => {
  it('shows deposits and trades newest first without depending on market data', async () => {
    const services = await makeServices()
    renderHistory(services)

    const rows = await screen.findAllByRole('row')

    expect(rows).toHaveLength(4)
    expect(within(rows[1]!).getByRole('rowheader')).toHaveTextContent('Venta')
    expect(within(rows[2]!).getByRole('rowheader')).toHaveTextContent('Compra')
    expect(within(rows[3]!).getByRole('rowheader')).toHaveTextContent('Depósito inicial')
    expect(screen.getAllByText('crypto:bitcoin')).toHaveLength(2)
  })

  it('filters purchases and sales while keeping deposits in Todo only', async () => {
    const services = await makeServices()
    const { user } = renderHistory(services)
    await screen.findByRole('row', { name: /Depósito inicial/ })

    await user.click(screen.getByRole('button', { name: 'Compras' }))
    expect(screen.getAllByRole('row')).toHaveLength(2)
    expect(screen.getByRole('row', { name: /Compra.*crypto:bitcoin/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Depósito inicial/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ventas' }))
    expect(screen.getByRole('row', { name: /Venta.*crypto:bitcoin/ })).toBeInTheDocument()
    expect(screen.queryByRole('row', { name: /Compra/ })).not.toBeInTheDocument()
  })

  it('paginates the filtered ledger entries', async () => {
    const services = await makeServices(20)
    const { user } = renderHistory(services)

    expect(await screen.findByText('Mostrando 1–20 de 21 operaciones')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(21)

    await user.click(screen.getByRole('button', { name: 'Página 2' }))

    expect(screen.getByText('Mostrando 21–21 de 21 operaciones')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(2)
  })

  it('shows an empty state for a ledger without entries', async () => {
    const services = await makeServices(0, false)
    renderHistory(services)

    expect(await screen.findByText('Aún no hay operaciones')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ir a Portfolio' })).toHaveAttribute(
      'href',
      '/portfolio',
    )
  })

  it('shows a recoverable error when the snapshot cannot be loaded', async () => {
    const services = await makeServices(0, false)
    const corruptDataError: LedgerRepositoryError = {
      kind: 'CORRUPT_DATA',
      index: 0,
      issues: ['invalid entry'],
    }
    const brokenServices: LedgerServices = {
      ...services,
      snapshot: undefined,
      loadSnapshot: async () => err(corruptDataError),
    }
    renderHistory(brokenServices)

    expect(await screen.findByText('No se pudo cargar el historial')).toBeInTheDocument()
    expect(
      screen.getByText('Los datos guardados están dañados y no se pueden leer.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})
