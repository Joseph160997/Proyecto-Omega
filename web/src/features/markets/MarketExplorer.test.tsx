// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketExplorer } from '@/features/markets/MarketExplorer'
import { makeMarket } from '@/test-utils/makeMarket'

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

describe('MarketExplorer: paginación', () => {
  it('muestra la primera página de 20 filas', () => {
    renderExplorer()

    expect(status()).toHaveTextContent('Mostrando 1–20 de 45 activos')
    expect(screen.getAllByRole('rowheader')).toHaveLength(20)
    expect(screen.getByText('Página 1 de 3')).toBeInTheDocument()
  })

  it('cambiar de página actualiza la URL, el contenido y sube al inicio de la tabla', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    const { router, user } = renderExplorer()

    await user.click(screen.getByRole('button', { name: 'Página 2' }))

    await waitFor(() => expect(router.state.location.search).toBe('?page=2'))
    expect(status()).toHaveTextContent('Mostrando 21–40 de 45 activos')
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
    expect(scrollIntoView).toHaveBeenCalled()
  })

  it('una página fuera de rango en la URL se corrige a la última', () => {
    renderExplorer('/markets?page=99')

    expect(status()).toHaveTextContent('Mostrando 41–45 de 45 activos')
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('con una sola página no hay paginación', () => {
    renderExplorer('/markets', makeMarket(15))

    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
  })
})

describe('MarketExplorer: búsqueda', () => {
  it('filtra, reemplaza la entrada del historial y oculta los tops', async () => {
    const { router, user } = renderExplorer()

    await user.type(searchBox(), 'coin1')

    await waitFor(() => expect(router.state.location.search).toBe('?q=coin1'))
    expect(router.state.historyAction).toBe('REPLACE')
    expect(status()).toHaveTextContent('Mostrando 1–10 de 10 coincidencias')
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Ganadores 24 h' })).not.toBeInTheDocument()
  })

  it('buscar vuelve a la primera página', async () => {
    const { router, user } = renderExplorer('/markets?page=3')

    await user.type(searchBox(), 'coin')

    await waitFor(() => expect(router.state.location.search).toBe('?q=coin'))
    expect(status()).toHaveTextContent('Mostrando 1–20 de 45 coincidencias')
  })

  it('sin coincidencias explica qué se buscó', async () => {
    const { user } = renderExplorer()

    await user.type(searchBox(), 'zzz')

    expect(await screen.findByText('Ningún activo coincide con «zzz».')).toBeInTheDocument()
    expect(status()).toHaveTextContent('Sin resultados')
  })

  it('se puede editar en medio del texto sin que el cursor salte', async () => {
    const { user } = renderExplorer()
    const input = searchBox()

    await user.type(input, 'ab')
    await user.type(input, 'X', { initialSelectionStart: 1, initialSelectionEnd: 1 })

    expect(input).toHaveValue('aXb')
  })

  it('el botón de borrar limpia el campo y la URL, y devuelve el foco', async () => {
    const { router, user } = renderExplorer('/markets?q=coin1')

    await user.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))

    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(searchBox()).toHaveValue('')
    expect(searchBox()).toHaveFocus()
  })

  it('el campo sigue a la URL cuando cambia por otra causa (Atrás, otro enlace)', async () => {
    const { router } = renderExplorer('/markets?q=coin1')

    expect(searchBox()).toHaveValue('coin1')

    await router.navigate('/markets')
    await waitFor(() => expect(searchBox()).toHaveValue(''))

    await router.navigate(-1)
    await waitFor(() => expect(searchBox()).toHaveValue('coin1'))
  })

  it('no recorta los espacios mientras se escribe', async () => {
    const { user } = renderExplorer()
    const input = searchBox()

    await user.type(input, 'coin ')

    expect(input).toHaveValue('coin ')
  })
})

describe('MarketExplorer: orden', () => {
  it('hacer clic en una columna ordena, marca aria-sort y alterna la dirección', async () => {
    const { router, user } = renderExplorer()
    const header = () => screen.getByRole('columnheader', { name: /Precio/ })

    await user.click(screen.getByRole('button', { name: /Precio/ }))

    await waitFor(() => expect(router.state.location.search).toBe('?sort=price&dir=desc'))
    expect(header()).toHaveAttribute('aria-sort', 'descending')
    expect(firstRowName()).toHaveAccessibleName(/^coin45/)

    await user.click(screen.getByRole('button', { name: /Precio/ }))

    await waitFor(() => expect(header()).toHaveAttribute('aria-sort', 'ascending'))
    expect(firstRowName()).toHaveAccessibleName(/^coin01/)
  })

  it('ordenar vuelve a la primera página', async () => {
    const { router, user } = renderExplorer('/markets?page=2')

    await user.click(screen.getByRole('button', { name: /Precio/ }))

    await waitFor(() => expect(router.state.location.search).toBe('?sort=price&dir=desc'))
  })
})

describe('MarketExplorer: vistas', () => {
  it('cambiar de vista filtra, usa su orden y marca la vista actual', async () => {
    const { router, user } = renderExplorer()

    await user.click(screen.getByRole('link', { name: 'Ganadores 24 h' }))

    await waitFor(() => expect(router.state.location.search).toBe('?view=gainers'))
    expect(screen.getByRole('link', { name: 'Ganadores 24 h' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('link', { name: 'Todos' })).not.toHaveAttribute('aria-current')
    expect(status()).toHaveTextContent('Mostrando 1–20 de 23 activos')
    expect(firstRowName()).toHaveAccessibleName(/^coin45/)
  })

  it('cambiar de vista conserva la búsqueda', async () => {
    const { router, user } = renderExplorer('/markets?q=coin')

    await user.click(screen.getByRole('link', { name: 'Perdedores 24 h' }))

    await waitFor(() => expect(router.state.location.search).toBe('?view=losers&q=coin'))
  })

  it('"Ver todo" de una tarjeta lleva a la lista completa de esa vista', async () => {
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

  it('una vista vacía lo dice', () => {
    renderExplorer(
      '/markets?view=gainers',
      makeMarket(1).map((quote) => ({ ...quote, change24hPercent: -2 })),
    )

    expect(screen.getByText('No hay activos en esta vista.')).toBeInTheDocument()
  })
})

describe('MarketExplorer: resumen y tarjetas', () => {
  it('en la vista principal se ven el resumen y las cuatro tarjetas', () => {
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
  ])('las tarjetas se ocultan con %s, pero el resumen se queda', (_label, entry) => {
    renderExplorer(entry)

    expect(screen.queryByRole('heading', { name: 'Ganadores 24 h' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Resumen del mercado' })).toBeInTheDocument()
  })
})
