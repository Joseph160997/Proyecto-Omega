// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { PillNav } from '@/components/ui/PillNav'

const ITEMS = [
  { id: 'a', label: 'Alfa', to: '/x?view=a' },
  { id: 'b', label: 'Beta', to: '/x?view=b' },
]

const renderNav = (currentId: string) =>
  render(
    <MemoryRouter>
      <PillNav label="Vistas" items={ITEMS} currentId={currentId} />
    </MemoryRouter>,
  )

describe('PillNav', () => {
  it('is a named navigation with one link per item', () => {
    renderNav('a')

    expect(screen.getByRole('navigation', { name: 'Vistas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/x?view=a')
    expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('href', '/x?view=b')
  })

  it('only the current item has aria-current', () => {
    renderNav('b')

    expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Alfa' })).not.toHaveAttribute('aria-current')
  })

  it('marks no item when the current id does not exist', () => {
    renderNav('zzz')

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })
})
