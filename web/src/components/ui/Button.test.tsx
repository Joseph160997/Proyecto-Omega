// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('defaults to a non-submit button and renders its label', () => {
    render(<Button>Guardar</Button>)

    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button')
  })

  it('renders a leading icon and forwards button properties', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <Button
        type="submit"
        variant="primary"
        size="sm"
        leadingIcon={<span aria-hidden="true">+</span>}
        className="custom-class"
        onClick={onClick}
      >
        Crear
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Crear' })

    expect(button).toHaveAttribute('type', 'submit')
    expect(button).toHaveClass('custom-class')
    expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent('+')
    await user.click(button)

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('marks loading buttons busy and disables them without losing their label', () => {
    render(<Button loading>Guardando</Button>)

    const button = screen.getByRole('button', { name: 'Guardando' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('preserves an explicit disabled state and omits aria-busy when idle', () => {
    render(<Button disabled>Sin permisos</Button>)

    const button = screen.getByRole('button', { name: 'Sin permisos' })
    expect(button).toBeDisabled()
    expect(button).not.toHaveAttribute('aria-busy')
  })
})
