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
  it('es una navegación con nombre y un enlace por elemento', () => {
    renderNav('a')

    expect(screen.getByRole('navigation', { name: 'Vistas' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Alfa' })).toHaveAttribute('href', '/x?view=a')
    expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('href', '/x?view=b')
  })

  it('solo el elemento actual lleva aria-current', () => {
    renderNav('b')

    expect(screen.getByRole('link', { name: 'Beta' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Alfa' })).not.toHaveAttribute('aria-current')
  })

  it('si el actual no existe, ninguno queda marcado', () => {
    renderNav('zzz')

    for (const link of screen.getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current')
    }
  })
})