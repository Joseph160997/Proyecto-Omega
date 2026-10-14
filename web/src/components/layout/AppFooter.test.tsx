// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AppFooter } from '@/components/layout/AppFooter'

describe('AppFooter', () => {
  it('states that this is an educational simulation', () => {
    render(<AppFooter />)

    expect(screen.getByRole('contentinfo')).toHaveTextContent(/Simulación educativa/)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/no es asesoría financiera/)
  })

  it('credits CoinGecko with a safe link that announces the new tab', () => {
    render(<AppFooter />)

    const link = screen.getByRole('link', { name: /CoinGecko/ })

    expect(link).toHaveAttribute('href', 'https://www.coingecko.com/')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link).toHaveAccessibleName('CoinGecko (se abre en una pestaña nueva)')
  })
})
