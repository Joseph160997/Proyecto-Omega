import { describe, expect, it } from 'vitest'

import { cx } from '@/lib/cx'

describe('cx', () => {
  it('une las clases con un espacio', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it('omite false, null, undefined y strings vacíos', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('incluye una clase condicional cuando la condición se cumple', () => {
    const active = true

    expect(cx('base', active && 'on')).toBe('base on')
    expect(cx('base', !active && 'on')).toBe('base')
  })

  it('sin clases devuelve un string vacío', () => {
    expect(cx()).toBe('')
    expect(cx(false, null)).toBe('')
  })
})
