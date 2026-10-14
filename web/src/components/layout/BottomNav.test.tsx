// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { BottomNav } from '@/components/layout/BottomNav'

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>
}

function renderNav(entry = '/markets') {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <BottomNav />
      <Where />
    </MemoryRouter>,
  )

  return userEvent.setup()
}

const moreButton = () => screen.getByRole('button', { name: 'Más' })

describe('BottomNav', () => {
  it('is the main navigation with four links and a More button', () => {
    renderNav()

    const nav = screen.getByRole('navigation', { name: 'Navegación principal' })

    expect(nav).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Markets' })).toHaveAttribute('href', '/markets')
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute('href', '/portfolio')
    expect(screen.getByRole('link', { name: 'Watchlist' })).toHaveAttribute('href', '/watchlist')
    expect(moreButton()).toBeInTheDocument()
  })

  it('only the current page has aria-current', () => {
    renderNav('/markets')

    expect(screen.getByRole('link', { name: 'Markets' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current')
  })

  it('Dashboard is current only at the exact "/" path', () => {
    renderNav('/')

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  describe('More menu', () => {
    it('starts closed with no secondary links', () => {
      renderNav()

      expect(moreButton()).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('link', { name: 'Alerts' })).not.toBeInTheDocument()
    })

    it('opens Alerts, History, and Settings links and connects aria-controls', async () => {
      const user = renderNav()

      await user.click(moreButton())

      expect(moreButton()).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('link', { name: 'Alerts' })).toHaveAttribute('href', '/alerts')
      expect(screen.getByRole('link', { name: 'History' })).toHaveAttribute('href', '/history')
      expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')

      const panel = screen.getByRole('link', { name: 'Alerts' }).closest('ul')

      expect(moreButton()).toHaveAttribute('aria-controls', panel?.id)
    })

    it('closes when More is clicked a second time', async () => {
      const user = renderNav()

      await user.click(moreButton())
      await user.click(moreButton())

      expect(screen.queryByRole('link', { name: 'Alerts' })).not.toBeInTheDocument()
    })

    it('Escape closes it and returns focus to the button', async () => {
      const user = renderNav()

      await user.click(moreButton())
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('link', { name: 'Alerts' })).not.toBeInTheDocument()
      expect(moreButton()).toHaveFocus()
    })

    it('closes when clicking outside', async () => {
      const user = renderNav()

      await user.click(moreButton())
      await user.click(document.body)

      expect(screen.queryByRole('link', { name: 'Alerts' })).not.toBeInTheDocument()
    })

    it('navigates and closes the menu when an option is selected', async () => {
      const user = renderNav()

      await user.click(moreButton())
      await user.click(screen.getByRole('link', { name: 'History' }))

      expect(screen.getByTestId('where')).toHaveTextContent('/history')
      expect(screen.queryByRole('link', { name: 'Alerts' })).not.toBeInTheDocument()
    })

    it('marks the button when the current page is inside More', () => {
      renderNav('/history')

      expect(moreButton()).toHaveAttribute('aria-current', 'true')
    })

    it('does not mark the button on a page in the main bar', () => {
      renderNav('/markets')

      expect(moreButton()).not.toHaveAttribute('aria-current')
    })
  })
})
