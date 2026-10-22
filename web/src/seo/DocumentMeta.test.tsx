// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Link, MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'

import { DocumentMeta } from './DocumentMeta'

afterEach(() => {
  document.head.innerHTML = ''
  document.title = ''
})

/** `siteUrl = null` simulates an unconfigured site URL. */
function renderAt(path: string, siteUrl: string | null = 'https://omega.example') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <DocumentMeta siteUrl={siteUrl} />
      <Link to="/portfolio">Portfolio</Link>
      <Link to="/markets/crypto%3Abitcoin">Bitcoin</Link>
      <Link to="/markets?view=gainers&page=2">Gainers</Link>
    </MemoryRouter>,
  )

  return userEvent.setup()
}

const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')
const robots = () => document.head.querySelector('meta[name="robots"]')?.getAttribute('content')

describe('DocumentMeta', () => {
  it('sets the title and description for the current page', () => {
    renderAt('/markets')

    expect(document.title).toBe('Mercados · Omega Markets')
    expect(
      document.head.querySelector('meta[name="description"]')?.getAttribute('content'),
    ).toContain('Top 250')
  })

  it('uses a clean canonical URL without query parameters', () => {
    renderAt('/markets?view=gainers&page=2&q=sol')

    expect(canonical()).toBe('https://omega.example/markets')
  })

  it('updates metadata when navigating to a private page', async () => {
    const user = renderAt('/markets')

    await user.click(screen.getByRole('link', { name: 'Portfolio' }))

    expect(document.title).toBe('Portafolio · Omega Markets')
    expect(robots()).toBe('noindex')
    expect(canonical()).toBeUndefined()
  })

  it('uses noindex metadata for a market asset detail route', async () => {
    const user = renderAt('/markets')

    await user.click(screen.getByRole('link', { name: 'Bitcoin' }))

    expect(document.title).toBe('Detalle de activo · Omega Markets')
    expect(robots()).toBe('noindex')
    expect(canonical()).toBeUndefined()
  })

  it('does not change title or canonical when market query parameters change', async () => {
    const user = renderAt('/markets')

    await user.click(screen.getByRole('link', { name: 'Gainers' }))

    expect(document.title).toBe('Mercados · Omega Markets')
    expect(canonical()).toBe('https://omega.example/markets')
  })

  it('marks an unknown route as noindex and omits its canonical URL', () => {
    renderAt('/does-not-exist')

    expect(document.title).toBe('Página no encontrada · Omega Markets')
    expect(robots()).toBe('noindex')
    expect(canonical()).toBeUndefined()
  })

  it('omits canonical when the site URL is explicitly disabled', () => {
    renderAt('/markets', null)

    expect(canonical()).toBeUndefined()
    expect(document.title).toBe('Mercados · Omega Markets')
  })
})
