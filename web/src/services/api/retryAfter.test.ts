import { describe, expect, it } from 'vitest'

import { parseRetryAfter } from '@/services/api/retryAfter'

const NOW = Date.parse('Wed, 21 Oct 2015 07:27:30 GMT')

describe('parseRetryAfter', () => {
  it('interpreta segundos enteros', () => {
    expect(parseRetryAfter('30', NOW)).toBe(30_000)
    expect(parseRetryAfter(' 5 ', NOW)).toBe(5_000)
    expect(parseRetryAfter('0', NOW)).toBe(0)
  })

  it('interpreta una fecha HTTP futura como la diferencia con ahora', () => {
    expect(parseRetryAfter('Wed, 21 Oct 2015 07:28:00 GMT', NOW)).toBe(30_000)
  })

  it('una fecha pasada vale cero', () => {
    expect(parseRetryAfter('Wed, 21 Oct 2015 07:00:00 GMT', NOW)).toBe(0)
  })

  it('acota esperas absurdas a 24 horas', () => {
    expect(parseRetryAfter('999999999', NOW)).toBe(86_400_000)
  })

  it.each([[null], [''], ['abc'], ['-5'], ['1.5'], ['soon'], ['9'.repeat(400)]])(
    'devuelve undefined para %j',
    (value) => {
      expect(parseRetryAfter(value, NOW)).toBeUndefined()
    },
  )
})
