import { describe, expect, it } from 'vitest'

import { clampPage, pageWindow, paginate, totalPagesFor } from '@/lib/pagination'

import type { PageItem } from '@/lib/pagination'

describe('totalPagesFor', () => {
  it.each([
    [0, 20, 1],
    [1, 20, 1],
    [20, 20, 1],
    [21, 20, 2],
    [250, 20, 13],
  ])('%s elementos en páginas de %s → %s páginas', (items, size, expected) => {
    expect(totalPagesFor(items, size)).toBe(expected)
  })

  it.each([[0], [-1], [1.5], [NaN]])('rejects page size %s', (size) => {
    expect(() => totalPagesFor(10, size)).toThrow(RangeError)
  })

  it.each([[-1], [1.5], [NaN]])('rejects a total of %s items', (items) => {
    expect(() => totalPagesFor(items, 20)).toThrow(RangeError)
  })
})

describe('clampPage', () => {
  it.each([
    [1, 13, 1],
    [5, 13, 5],
    [13, 13, 13],
    [0, 13, 1],
    [-3, 13, 1],
    [99, 13, 13],
    [2.7, 13, 2],
    [NaN, 13, 1],
    [Infinity, 13, 1],
  ])('página %s de %s → %s', (page, total, expected) => {
    expect(clampPage(page, total)).toBe(expected)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 45 }, (_, index) => index + 1)

  it('returns the first page and its range', () => {
    const view = paginate(items, 1, 20)

    expect(view.items).toEqual(items.slice(0, 20))
    expect(view).toMatchObject({ page: 1, totalPages: 3, totalItems: 45, from: 1, to: 20 })
  })

  it('allows the last page to contain fewer items', () => {
    const view = paginate(items, 3, 20)

    expect(view.items).toEqual([41, 42, 43, 44, 45])
    expect(view).toMatchObject({ page: 3, from: 41, to: 45 })
  })

  it('clamps an out-of-range page and reports it in `page`', () => {
    expect(paginate(items, 99, 20).page).toBe(3)
    expect(paginate(items, 0, 20).page).toBe(1)
    expect(paginate(items, NaN, 20).page).toBe(1)
  })

  it('returns an empty page with a 0–0 range when there are no items', () => {
    expect(paginate([], 1, 20)).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      totalItems: 0,
      from: 0,
      to: 0,
    })
  })

  it('returns a copy without mutating the input array', () => {
    const view = paginate(items, 1, 20)

    view.items.push(999)

    expect(items).toHaveLength(45)
  })
})

describe('pageWindow', () => {
  const cases: Array<[number, number, PageItem[]]> = [
    [1, 1, [1]],
    [1, 5, [1, 2, 3, 4, 5]],
    [1, 7, [1, 2, 3, 4, 5, 6, 7]],
    [1, 13, [1, 2, 3, 4, 5, 'gap', 13]],
    [4, 13, [1, 2, 3, 4, 5, 'gap', 13]],
    [5, 13, [1, 'gap', 4, 5, 6, 'gap', 13]],
    [7, 13, [1, 'gap', 6, 7, 8, 'gap', 13]],
    [9, 13, [1, 'gap', 8, 9, 10, 'gap', 13]],
    [10, 13, [1, 'gap', 9, 10, 11, 12, 13]],
    [13, 13, [1, 'gap', 9, 10, 11, 12, 13]],
    [99, 13, [1, 'gap', 9, 10, 11, 12, 13]],
    [0, 13, [1, 2, 3, 4, 5, 'gap', 13]],
    [4, 8, [1, 2, 3, 4, 5, 'gap', 8]],
    [5, 8, [1, 'gap', 4, 5, 6, 7, 8]],
  ]

  it.each(cases)('page %s of %s', (current, total, expected) => {
    expect(pageWindow(current, total)).toEqual(expected)
  })

  it('returns an empty list when there are no pages', () => {
    expect(pageWindow(1, 0)).toEqual([])
  })

  it('increases the window when more siblings are requested', () => {
    expect(pageWindow(10, 20, 2)).toEqual([1, 'gap', 8, 9, 10, 11, 12, 'gap', 20])
    expect(pageWindow(1, 20, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, 'gap', 20])
  })

  it.each([[-1], [1.5], [NaN]])('rejects siblings = %s', (siblings) => {
    expect(() => pageWindow(1, 13, siblings)).toThrow(RangeError)
  })

  it('keeps a consistent seven-item window when there are more than seven pages', () => {
    for (let total = 8; total <= 30; total += 1) {
      for (let page = 1; page <= total; page += 1) {
        const window = pageWindow(page, total)
        const numbers = window.filter((item): item is number => item !== 'gap')

        expect(window).toHaveLength(7)
        expect(numbers).toContain(1)
        expect(numbers).toContain(total)
        expect(numbers).toContain(page)
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b))

        window.forEach((item, index) => {
          if (item !== 'gap') return

          const before = window[index - 1]
          const after = window[index + 1]

          // Cada "…" debe esconder al menos 2 páginas; con 1 se mostraría el número.
          expect(
            typeof before === 'number' && typeof after === 'number' && after - before - 1,
          ).toBeGreaterThanOrEqual(2)
        })
      }
    }
  })
})
