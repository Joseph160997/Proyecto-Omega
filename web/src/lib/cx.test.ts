import { describe, expect, it } from 'vitest'

import { cx } from '@/lib/cx'

describe('cx', () => {
  it('joins classes with a space', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it('omits false, null, undefined, and empty strings', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b')
  })

  it('includes a conditional class when the condition is true', () => {
    const active = true

    expect(cx('base', active && 'on')).toBe('base on')
    expect(cx('base', !active && 'on')).toBe('base')
  })

  it('returns an empty string when there are no classes', () => {
    expect(cx()).toBe('')
    expect(cx(false, null)).toBe('')
  })
})
