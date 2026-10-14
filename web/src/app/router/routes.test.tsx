// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { routes } from '@/app/router/routes'

import type { RouteObject } from 'react-router-dom'

function Boom(): never {
  throw new Error('broken page')
}

function renderRoutes(routeList: RouteObject[], path: string) {
  const router = createMemoryRouter(routeList, { initialEntries: [path] })
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('app routes', () => {
  it('renders unknown routes inside the app shell', () => {
    renderRoutes(routes, '/unknown-route')

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('renders settings inside the shell with a link to the main content', () => {
    renderRoutes(routes, '/settings')

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('link', { name: 'Saltar al contenido principal' })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('renders page errors inside the shell while keeping navigation available', () => {
    const [root] = routes
    const layout = root?.children?.[0]

    if (!root || !layout) throw new Error('Route structure changed; update this test')

    const withBrokenPage: RouteObject[] = [
      {
        path: root.path,
        element: root.element,
        errorElement: root.errorElement,
        children: [
          {
            errorElement: layout.errorElement,
            children: [...(layout.children ?? []), { path: 'broken', element: <Boom /> }],
          },
        ],
      },
    ]

    renderRoutes(withBrokenPage, '/broken')

    expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument()
    expect(screen.getAllByRole('navigation', { name: 'Navegación principal' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })
})
