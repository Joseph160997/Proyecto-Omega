// @vitest-environment jsdom
import { act, render } from '@testing-library/react'
import axe from 'axe-core'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppFooter } from '@/components/layout/AppFooter'
import { BottomNav } from '@/components/layout/BottomNav'
import { Toaster } from '@/components/ui/Toaster'
import { MarketExplorer } from '@/features/markets/MarketExplorer'
import { toast, useToastStore } from '@/stores/toast.store'
import { makeMarket } from '@/test-utils/makeMarket'

/** Devuelve las infracciones de accesibilidad estructural de un trozo de interfaz. */
async function violationsIn(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: {
      // jsdom no calcula estilos ni layout: el contraste se verifica en tokens.test.ts.
      'color-contrast': { enabled: false },
      // Son fragmentos, no páginas completas: no tienen todos sus landmarks.
      region: { enabled: false },
    },
  })

  return results.violations.map(
    (v) => `${v.id}: ${v.help} -> ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
  )
}

function renderExplorer(entry: string) {
  const router = createMemoryRouter(
    [{ path: '/markets', element: <MarketExplorer quotes={makeMarket(45)} /> }],
    { initialEntries: [entry] },
  )

  return render(<RouterProvider router={router} />)
}

beforeAll(() => {
  // axe intenta usar un canvas para comprobar iconos; jsdom no lo implementa y avisa en consola.
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
})

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

describe('structural accessibility (axe)', () => {
  it('detects accessibility violations (the test does not pass vacuously)', async () => {
    const { container } = render(
      <div>
        <button type="button" />
        <img src="x.png" />
        <input type="text" />
      </div>,
    )

    const found = (await violationsIn(container)).join('\n')

    expect(found).toContain('button-name')
    expect(found).toContain('image-alt')
    expect(found).toContain('label')
  })

  it('the market explorer on its main view', async () => {
    const { container } = renderExplorer('/markets')

    expect(await violationsIn(container)).toEqual([])
  })

  it('the market explorer with no search results', async () => {
    const { container } = renderExplorer('/markets?q=zzz')

    expect(await violationsIn(container)).toEqual([])
  })

  it('the bottom navigation with the "More" menu open', async () => {
    const { container, getByRole } = render(
      <MemoryRouter initialEntries={['/history']}>
        <BottomNav />
      </MemoryRouter>,
    )

    await act(async () => {
      getByRole('button', { name: 'Más' }).click()
    })

    expect(await violationsIn(container)).toEqual([])
  })

  it('notifications with an error and an informational notice', async () => {
    const { container } = render(<Toaster />)

    act(() => {
      toast.error({
        title: 'Mal',
        description: 'Detalle',
        action: { label: 'Reintentar', onClick: () => {} },
      })
      toast.info({ title: 'Info' })
    })

    expect(await violationsIn(container)).toEqual([])
  })

  it('the footer', async () => {
    const { container } = render(<AppFooter />)

    expect(await violationsIn(container)).toEqual([])
  })
})
