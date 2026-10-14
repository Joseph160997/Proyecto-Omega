// @vitest-environment jsdom
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { TopCards } from '@/features/markets/TopCards'
import { makeMarket } from '@/test-utils/makeMarket'
import { SAMPLE_QUOTES } from '@/test-utils/sampleQuotes'

import type { MarketQuote } from '@/domain/market/quote'

const renderCards = (quotes: readonly MarketQuote[]) =>
  render(
    <MemoryRouter>
      <TopCards quotes={quotes} />
    </MemoryRouter>,
  )

describe('TopCards', () => {
  it('shows one card per view with its title', () => {
    renderCards(SAMPLE_QUOTES)

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'Ganadores 24 h',
      'Perdedores 24 h',
      'Mayor volumen',
      'Más activas',
    ])
  })

  it('each card links to the full list for its view', () => {
    renderCards(SAMPLE_QUOTES)

    expect(screen.getByRole('link', { name: 'Ver todo: Ganadores 24 h' })).toHaveAttribute(
      'href',
      '/markets?view=gainers',
    )
    expect(screen.getByRole('link', { name: 'Ver todo: Perdedores 24 h' })).toHaveAttribute(
      'href',
      '/markets?view=losers',
    )
    expect(screen.getByRole('link', { name: 'Ver todo: Mayor volumen' })).toHaveAttribute(
      'href',
      '/markets?view=volume',
    )
    expect(screen.getByRole('link', { name: 'Ver todo: Más activas' })).toHaveAttribute(
      'href',
      '/markets?view=active',
    )
  })

  it('shows at most five assets per card', () => {
    renderCards(makeMarket(45))

    for (const list of screen.getAllByRole('list')) {
      expect(within(list).getAllByRole('listitem')).toHaveLength(5)
    }
  })

  it('each card starts with the highest-ranked gainers', () => {
    renderCards(SAMPLE_QUOTES)

    const [gainers] = screen.getAllByRole('list')
    const symbols = within(gainers as HTMLElement)
      .getAllByRole('listitem')
      .map((item) => item.textContent)

    // eth sube 5 %, btc sube 0.5 %; ada (+0.004 %) se ve 0.00 % y no entra.
    expect(symbols).toHaveLength(2)
    expect(symbols[0]).toContain('ETH')
    expect(symbols[1]).toContain('BTC')
  })

  it('the volume card shows volume and the activity card shows the ratio', () => {
    renderCards(SAMPLE_QUOTES)

    const [, , volume, active] = screen.getAllByRole('list')

    expect(within(volume as HTMLElement).getAllByRole('listitem')[0]).toHaveTextContent('ETH$100')
    // sol: 40 / 100 = 40 %.
    expect(within(active as HTMLElement).getAllByRole('listitem')[0]).toHaveTextContent('SOL40.00%')
  })

  it('each card displays an empty state when there is no data', () => {
    renderCards([])

    expect(screen.getAllByText('Sin datos.')).toHaveLength(4)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
