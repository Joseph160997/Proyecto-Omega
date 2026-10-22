// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketExplorer } from '@/features/markets/MarketExplorer'
import { makeMarket } from '@/test-utils/makeMarket'
import { makeQuote } from '@/test-utils/makeQuote'

import type { MarketQuote } from '@/domain/market/quote'

afterEach(() => {
  vi.restoreAllMocks()
})

function renderExplorer(entry = '/markets', quotes: readonly MarketQuote[] = makeMarket(45)) {
  const router = createMemoryRouter(
    [{ path: '/markets', element: <MarketExplorer quotes={quotes} /> }],
    { initialEntries: [entry] },
  )

  render(<RouterProvider router={router} />)

  return { router, user: userEvent.setup() }
}

const status = () => screen.getByRole('status')
const firstRowName = () => screen.getAllByRole('rowheader')[0]
const searchBox = () => screen.getByRole('searchbox', { name: 'Buscar por nombre o símbolo' })

describe('MarketExplorer: pagination', () => {
  it('shows the first page with 20 rows', () => {
    renderExplorer()

    expect(status()).toHaveTextContent('Mostrando 1–20 de 45 activos')
    expect(screen.getAllByRole('rowheader')).toHaveLength(20)
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
  })

  it('changing pages updates the URL and content, then scrolls to the table top', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { router, user } = renderExplorer()

    await user.click(screen.getByRole('button', { name: 'Página 2' }))

    await waitFor(() => expect(router.state.location.search).toBe('?page=2'))
    expect(status()).toHaveTextContent('Mostrando 21–40 de 45 activos')
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('an out-of-range page in the URL is clamped to the last page', () => {
    renderExplorer('/markets?page=99')

    expect(status()).toHaveTextContent('Mostrando 41–45 de 45 activos')
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('hides pagination when there is only one page', () => {
    renderExplorer('/markets', makeMarket(15))

    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
  })
})

describe('MarketExplorer: search', () => {
  it('filters, replaces the history entry, and hides the top cards', async () => {
    const { router, user } = renderExplorer()

    await user.type(searchBox(), 'coin1')

    await waitFor(() => expect(router.state.location.search).toBe('?q=coin1'))
    expect(router.state.historyAction).toBe('REPLACE')
    expect(status()).toHaveTextContent('Mostrando 1–10 de 10 coincidencias')
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ganadores 24 h' })).not.toBeInTheDocument()
  })

  it('searching returns to the first page', async () => {
    const { router, user } = renderExplorer('/markets?page=3')

    await user.type(searchBox(), 'coin')

    await waitFor(() => expect(router.state.location.search).toBe('?q=coin'))
    expect(status()).toHaveTextContent('Mostrando 1–20 de 45 coincidencias')
  })

  it('explains the search when there are no matches', async () => {
    const { user } = renderExplorer()

    await user.type(searchBox(), 'zzz')

    expect(await screen.findByText('Ningún activo coincide con «zzz».')).toBeInTheDocument()
    expect(status()).toHaveTextContent('Sin resultados')
  })

  it('allows editing in the middle of the text without moving the cursor', async () => {
    const { user } = renderExplorer()
    const input = searchBox()

    await user.type(input, 'ab')
    await user.type(input, 'X', { initialSelectionStart: 1, initialSelectionEnd: 1 })

    expect(input).toHaveValue('aXb')
  })

  it('the clear button resets the field and URL, then restores focus', async () => {
    const { router, user } = renderExplorer('/markets?q=coin1')

    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))

    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(searchBox()).toHaveValue('')
    expect(searchBox()).toHaveFocus()
  })

  it('the field follows URL changes from other navigation (back or another link)', async () => {
    const { router } = renderExplorer('/markets?q=coin1')

    expect(searchBox()).toHaveValue('coin1')

    await router.navigate('/markets')
    await waitFor(() => expect(searchBox()).toHaveValue(''))

    await router.navigate(-1)
    await waitFor(() => expect(searchBox()).toHaveValue('coin1'))
  })

  it('does not trim spaces while typing', async () => {
    const { user } = renderExplorer()
    const input = searchBox()

    await user.type(input, 'coin ')

    expect(input).toHaveValue('coin ')
  })
})

describe('MarketExplorer: sorting', () => {
  it('clicking a column sorts, sets aria-sort, and toggles direction', async () => {
    const { router, user } = renderExplorer()
    const header = () => screen.getByRole('columnheader', { name: /Precio/ })

    await user.click(screen.getByRole('button', { name: /Precio/ }))

    await waitFor(() => expect(router.state.location.search).toBe('?sort=price&dir=desc'))
    expect(header()).toHaveAttribute('aria-sort', 'descending')
    expect(firstRowName()).toHaveAccessibleName(/^Ver detalles de coin45/)

    await user.click(screen.getByRole('button', { name: /Precio/ }))

    await waitFor(() => expect(header()).toHaveAttribute('aria-sort', 'ascending'))
    expect(firstRowName()).toHaveAccessibleName(/^Ver detalles de coin01/)
  })

  it('sorting returns to the first page', async () => {
    const { router, user } = renderExplorer('/markets?page=2')

    await user.click(screen.getByRole('button', { name: /Precio/ }))

    await waitFor(() => expect(router.state.location.search).toBe('?sort=price&dir=desc'))
  })
})

describe('MarketExplorer: asset navigation', () => {
  it('links asset names to their encoded detail routes and preserves the Portfolio action', async () => {
    const { router, user } = renderExplorer('/markets', [
      makeQuote('bitcoin', { assetId: 'crypto:bitcoin', name: 'Bitcoin', symbol: 'BTC' }),
    ])

    expect(screen.getByRole('link', { name: 'Ver detalles de Bitcoin' })).toHaveAttribute(
      'href',
      '/markets/crypto%3Abitcoin',
    )
    expect(screen.getByRole('link', { name: 'Operar Bitcoin (BTC)' })).toHaveAttribute(
      'href',
      '/portfolio?assetId=crypto%3Abitcoin',
    )
    await user.click(screen.getByRole('link', { name: 'Ver detalles de Bitcoin' }))

    expect(router.state.location.pathname).toBe('/markets/crypto%3Abitcoin')
  })
})

describe('MarketExplorer: views', () => {
  it('switching views filters, applies its sort, and marks the current view', async () => {
    const { router, user } = renderExplorer()

    await user.click(screen.getByRole('link', { name: 'Ganadores 24 h' }))

    await waitFor(() => expect(router.state.location.search).toBe('?view=gainers'))
    expect(screen.getByRole('link', { name: 'Ganadores 24 h' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Todos' })).not.toHaveAttribute('aria-current')
    expect(status()).toHaveTextContent('Mostrando 1–20 de 23 activos')
    expect(firstRowName()).toHaveAccessibleName(/^Ver detalles de coin45/)
  })

  it('switching views preserves the search', async () => {
    const { router, user } = renderExplorer('/markets?q=coin')

    await user.click(screen.getByRole('link', { name: 'Perdedores 24 h' }))

    await waitFor(() => expect(router.state.location.search).toBe('?view=losers&q=coin'))
  })

  it('a card’s View all link opens the full list for that view', async () => {
    const { router, user } = renderExplorer()

    expect(screen.getByRole('link', { name: 'Ver todo: Mayor volumen' })).toHaveAttribute(
      'href',
      '/markets?view=volume',
    )

    await user.click(screen.getByRole('link', { name: 'Ver todo: Mayor volumen' }))

    await waitFor(() => expect(router.state.location.search).toBe('?view=volume'))
    expect(screen.getByRole('link', { name: 'Mayor volumen' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('shows a message for an empty view', () => {
    renderExplorer(
      '/markets?view=gainers',
      makeMarket(1).map((quote) => ({ ...quote, change24hPercent: -2 })),
    )

    expect(screen.getByText('No hay activos en esta vista.')).toBeInTheDocument()
  })
})

describe('MarketExplorer: summary and top cards', () => {
  it('shows the summary and four top cards in the main view', () => {
    renderExplorer()

    expect(screen.getByRole('region', { name: 'Resumen del mercado' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual([
      'Ganadores 24 h',
      'Perdedores 24 h',
      'Mayor volumen',
      'Más activas',
      'Listado de activos',
    ])
  })

  it.each([
    ['otra vista', '/markets?view=losers'],
    ['una búsqueda', '/markets?q=coin'],
    ['la segunda página', '/markets?page=2'],
  ])('hides the cards for %s while keeping the summary visible', (_label, entry) => {
    renderExplorer(entry)

    expect(screen.queryByRole('heading', { name: 'Ganadores 24 h' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Resumen del mercado' })).toBeInTheDocument()
  })
})
