// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AUTO_DISMISS_MS } from '@/application/notifications/toasts'
import { Toaster } from '@/components/ui/Toaster'
import { toast, useToastStore } from '@/stores/toast.store'

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
})

afterEach(() => {
  vi.useRealTimers()
})

const advance = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

describe('Toaster', () => {
  it('the notifications region always exists, even when empty', () => {
    render(<Toaster />)

    expect(screen.getByRole('region', { name: 'Notificaciones' })).toBeInTheDocument()
  })

  it('shows the title and description', () => {
    render(<Toaster />)

    act(() => void toast.info({ title: 'Hola', description: 'Un detalle' }))

    expect(screen.getByText('Hola')).toBeInTheDocument()
    expect(screen.getByText('Un detalle')).toBeInTheDocument()
  })

  it('errors are alerts, but informational toasts are not', () => {
    render(<Toaster />)

    act(() => void toast.info({ title: 'Info' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    act(() => void toast.error({ title: 'Mal' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Mal')
  })

  it('the close button dismisses the toast', async () => {
    const user = userEvent.setup()
    render(<Toaster />)
    act(() => void toast.error({ title: 'Mal' }))

    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }))

    expect(screen.queryByText('Mal')).not.toBeInTheDocument()
  })

  it('the action button runs its handler without dismissing the toast', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Toaster />)
    act(() => void toast.error({ title: 'Mal', action: { label: 'Reintentar', onClick } }))

    await user.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Mal')).toBeInTheDocument()
  })

  it('replaces content with the same id instead of stacking', () => {
    render(<Toaster />)

    act(() => void toast.error({ id: 'x', title: 'Primero' }))
    act(() => void toast.error({ id: 'x', title: 'Segundo' }))

    expect(screen.queryByText('Primero')).not.toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(1)
    expect(screen.getByText('Segundo')).toBeInTheDocument()
  })

  it('shows at most three toasts', () => {
    render(<Toaster />)

    act(() => {
      ;['a', 'b', 'c', 'd'].forEach((title) => toast.error({ title }))
    })

    expect(screen.queryByText('a')).not.toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(3)
  })

  describe('cierre automático', () => {
    it('an informational toast dismisses after its duration', () => {
      vi.useFakeTimers()
      render(<Toaster />)
      act(() => void toast.info({ title: 'Hola' }))

      advance(AUTO_DISMISS_MS - 1)
      expect(screen.getByText('Hola')).toBeInTheDocument()

      advance(1)
      expect(screen.queryByText('Hola')).not.toBeInTheDocument()
    })

    it('an error toast does not dismiss automatically', () => {
      vi.useFakeTimers()
      render(<Toaster />)
      act(() => void toast.error({ title: 'Mal' }))

      advance(10 * 60_000)

      expect(screen.getByText('Mal')).toBeInTheDocument()
    })

    it('pauses on hover and restarts the full duration when the pointer leaves', () => {
      vi.useFakeTimers()
      render(<Toaster />)
      act(() => void toast.error({ title: 'Mal', duration: 3_000 }))
      const item = screen.getByRole('alert')

      fireEvent.mouseEnter(item)
      advance(60_000)
      expect(screen.getByText('Mal')).toBeInTheDocument()

      fireEvent.mouseLeave(item)
      advance(2_999)
      expect(screen.getByText('Mal')).toBeInTheDocument()

      advance(1)
      expect(screen.queryByText('Mal')).not.toBeInTheDocument()
    })

    it('also pauses while keyboard focus is inside', () => {
      vi.useFakeTimers()
      render(<Toaster />)
      act(() => void toast.error({ title: 'Mal', duration: 3_000 }))
      const close = screen.getByRole('button', { name: 'Cerrar aviso' })

      fireEvent.focusIn(close)
      advance(60_000)
      expect(screen.getByText('Mal')).toBeInTheDocument()

      fireEvent.focusOut(close)
      advance(3_000)
      expect(screen.queryByText('Mal')).not.toBeInTheDocument()
    })

    it('showing the same id again restarts the timer', () => {
      vi.useFakeTimers()
      render(<Toaster />)
      act(() => void toast.error({ id: 'x', title: 'A', duration: 1_000 }))

      advance(800)
      act(() => void toast.error({ id: 'x', title: 'B', duration: 1_000 }))
      advance(800)
      expect(screen.getByText('B')).toBeInTheDocument()

      advance(200)
      expect(screen.queryByText('B')).not.toBeInTheDocument()
    })
  })
})
