import { describe, expect, it } from 'vitest'

import {
  addToast,
  AUTO_DISMISS_MS,
  createToast,
  defaultDuration,
  dismissToast,
  MAX_TOASTS,
} from '@/application/notifications/toasts'

import type { Toast } from '@/application/notifications/toasts'

const toast = (id: string, title = id): Toast => createToast({ title }, id)
const ids = (toasts: readonly Toast[]) => toasts.map((item) => item.id)

describe('defaultDuration', () => {
  it('errors do not dismiss automatically; other variants do', () => {
    expect(defaultDuration('error')).toBeNull()
    expect(defaultDuration('info')).toBe(AUTO_DISMISS_MS)
    expect(defaultDuration('success')).toBe(AUTO_DISMISS_MS)
  })
})

describe('createToast', () => {
  it('defaults to info and uses the variant duration', () => {
    expect(createToast({ title: 'Hola' }, 'a')).toEqual({
      id: 'a',
      variant: 'info',
      title: 'Hola',
      description: undefined,
      action: undefined,
      duration: AUTO_DISMISS_MS,
    })
  })

  it('errors wait for user dismissal', () => {
    expect(createToast({ title: 'Mal', variant: 'error' }, 'a').duration).toBeNull()
  })

  it('honors a custom duration, including null', () => {
    expect(createToast({ title: 'x', duration: 1_200 }, 'a').duration).toBe(1_200)
    expect(createToast({ title: 'x', duration: null }, 'a').duration).toBeNull()
    expect(createToast({ title: 'x', variant: 'error', duration: 3_000 }, 'a').duration).toBe(3_000)
  })

  it.each([[0], [-5], [NaN], [Infinity]])(
    'an invalid duration (%s) falls back to the variant default',
    (duration) => {
      expect(createToast({ title: 'x', duration }, 'a').duration).toBe(AUTO_DISMISS_MS)
      expect(createToast({ title: 'x', variant: 'error', duration }, 'a').duration).toBeNull()
    },
  )

  it('preserves the description and action', () => {
    const action = { label: 'Reintentar', onClick: () => {} }
    const result = createToast({ title: 'x', description: 'detalle', action }, 'a')

    expect(result.description).toBe('detalle')
    expect(result.action).toBe(action)
  })
})

describe('addToast', () => {
  it('appends to the end', () => {
    expect(ids(addToast([toast('a')], toast('b')))).toEqual(['a', 'b'])
  })

  it('replaces a matching id in place without stacking', () => {
    const result = addToast([toast('a'), toast('b'), toast('c')], toast('b', 'nuevo'))

    expect(ids(result)).toEqual(['a', 'b', 'c'])
    expect(result[1]?.title).toBe('nuevo')
  })

  it(`drops the oldest items when more than ${MAX_TOASTS} are added`, () => {
    const result = [toast('a'), toast('b'), toast('c')].reduce<Toast[]>(
      (list, item) => addToast(list, item),
      [],
    )

    expect(ids(addToast(result, toast('d')))).toEqual(['b', 'c', 'd'])
  })

  it('replacing an item in a full list does not drop any items', () => {
    const full = [toast('a'), toast('b'), toast('c')]

    expect(ids(addToast(full, toast('a', 'nuevo')))).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the original list', () => {
    const original = [toast('a')]

    addToast(original, toast('b'))

    expect(ids(original)).toEqual(['a'])
  })
})

describe('dismissToast', () => {
  it('removes the toast with the given id', () => {
    expect(ids(dismissToast([toast('a'), toast('b')], 'a'))).toEqual(['b'])
  })

  it('an unknown id leaves the list unchanged', () => {
    expect(ids(dismissToast([toast('a')], 'zzz'))).toEqual(['a'])
  })
})
