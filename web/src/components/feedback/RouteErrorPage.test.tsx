// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'

function Boom(): never {
  throw new Error('test failure')
}

function renderBroken() {
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Home</p> },
      { path: '/broken', element: <Boom />, errorElement: <RouteErrorPage /> },
    ],
    { initialEntries: ['/broken'] },
  )

  render(<RouterProvider router={router} />)
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('RouteErrorPage', () => {
  it('shows recovery options instead of a blank screen', () => {
    renderBroken()

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Algo salió mal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('button', { name: 'Recargar la página' })).toBeInTheDocument()
  })

  it('shows technical details in development', () => {
    renderBroken()

    expect(screen.getByText('test failure')).toBeInTheDocument()
  })

  it('does not expose error messages in production', () => {
    vi.stubEnv('DEV', false)

    renderBroken()

    expect(screen.queryByText('test failure')).not.toBeInTheDocument()
    expect(screen.queryByText(/Detalle técnico/)).not.toBeInTheDocument()
  })
})
