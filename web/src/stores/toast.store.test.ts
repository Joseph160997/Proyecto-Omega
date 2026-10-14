import { beforeEach, describe, expect, it } from 'vitest'

import { createToastStore, toast, useToastStore } from '@/stores/toast.store'

describe('createToastStore', () => {
  it('generates distinct ids when none is provided', () => {
    const store = createToastStore()

    const first = store.getState().show({ title: 'a' })
    const second = store.getState().show({ title: 'b' })

    expect(first).not.toBe(second)
    expect(store.getState().toasts.map((item) => item.title)).toEqual(['a', 'b'])
  })

  it('uses a provided id and replaces a toast with the same id', () => {
    const store = createToastStore()

    expect(store.getState().show({ id: 'x', title: 'uno' })).toBe('x')
    store.getState().show({ id: 'x', title: 'dos' })

    expect(store.getState().toasts).toHaveLength(1)
    expect(store.getState().toasts[0]?.title).toBe('dos')
  })

  it('dismiss removes the toast', () => {
    const store = createToastStore()
    const id = store.getState().show({ title: 'a' })

    store.getState().dismiss(id)

    expect(store.getState().toasts).toEqual([])
  })

  it('each store is independent', () => {
    const one = createToastStore()
    const two = createToastStore()

    one.getState().show({ title: 'a' })

    expect(two.getState().toasts).toEqual([])
  })
})

describe('toast shortcuts', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] })
  })

  it('each shortcut sets its variant', () => {
    toast.info({ title: 'i' })
    toast.success({ title: 's' })
    toast.error({ title: 'e' })

    expect(useToastStore.getState().toasts.map((item) => item.variant)).toEqual([
      'info',
      'success',
      'error',
    ])
  })

  it('errors do not dismiss automatically', () => {
    toast.error({ title: 'e' })

    expect(useToastStore.getState().toasts[0]?.duration).toBeNull()
  })

  it('dismiss removes a toast by id', () => {
    toast.error({ id: 'x', title: 'e' })
    toast.dismiss('x')

    expect(useToastStore.getState().toasts).toEqual([])
  })
})
