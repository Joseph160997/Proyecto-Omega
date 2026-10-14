// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { MarketListingUnavailableError } from '@/features/markets/marketQueries'
import {
  REFRESH_FAILURE_TOAST_ID,
  useRefreshFailureToast,
} from '@/features/markets/useRefreshFailureToast'
import { toast, useToastStore } from '@/stores/toast.store'

interface Props {
  isRefetchError: boolean
  error: unknown
  refetch: () => Promise<unknown>
}

const refetch = vi.fn(async () => undefined)
const timeout = new MarketListingUnavailableError({ kind: 'TIMEOUT' })
const rateLimit = new MarketListingUnavailableError({ kind: 'RATE_LIMIT' })

const OK: Props = { isRefetchError: false, error: null, refetch }
const FAILED: Props = { isRefetchError: true, error: timeout, refetch }

const toasts = () => useToastStore.getState().toasts

function mount(initialProps: Props) {
  return renderHook((props: Props) => useRefreshFailureToast(props), { initialProps })
}

beforeEach(() => {
  useToastStore.setState({ toasts: [] })
  refetch.mockClear()
})

describe('useRefreshFailureToast', () => {
  it('shows nothing when there is no failure', () => {
    mount(OK)

    expect(toasts()).toEqual([])
  })

  it('a failure shows an error with its reason and a retry action', () => {
    mount(FAILED)

    expect(toasts()).toHaveLength(1)
    expect(toasts()[0]).toMatchObject({
      id: REFRESH_FAILURE_TOAST_ID,
      variant: 'error',
      title: 'No se pudo actualizar el mercado',
      description: 'El proveedor tardó demasiado en responder.',
    })

    toasts()[0]?.action?.onClick()

    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('does not duplicate the toast when the same failure rerenders', () => {
    const { rerender } = mount(FAILED)

    rerender({ ...FAILED })
    rerender({ ...FAILED })

    expect(toasts()).toHaveLength(1)
  })

  it('does not reappear after dismissal while the reason stays the same', () => {
    const { rerender } = mount(FAILED)

    act(() => void toast.dismiss(REFRESH_FAILURE_TOAST_ID))
    rerender({ ...FAILED })

    expect(toasts()).toEqual([])
  })

  it('updates the toast when the reason changes', () => {
    const { rerender } = mount(FAILED)

    rerender({ ...FAILED, error: rateLimit })

    expect(toasts()).toHaveLength(1)
    expect(toasts()[0]?.description).toContain('límite de consultas')
  })

  it('a successful refresh dismisses the toast', () => {
    const { rerender } = mount(FAILED)

    rerender(OK)

    expect(toasts()).toEqual([])
  })

  it('dismisses the toast when leaving the page', () => {
    const { unmount } = mount(FAILED)

    unmount()

    expect(toasts()).toEqual([])
  })
})
