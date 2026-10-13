// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { summarize } from '@/features/markets/marketStatsLogic'
import { SummaryStrip } from '@/features/markets/SummaryStrip'
import { SAMPLE_QUOTES } from '@/test-utils/sampleQuotes'

const texts = (role: 'term' | 'definition') =>
  screen.getAllByRole(role).map((element) => element.textContent)

describe('SummaryStrip', () => {
  it('muestra las cuatro métricas del conjunto y cuántos activos abarca', () => {
    render(<SummaryStrip summary={summarize(SAMPLE_QUOTES)} />)

    expect(screen.getByText('Resumen de los 6 activos cargados')).toBeInTheDocument()
    expect(texts('term')).toEqual(['Cap. total', 'Volumen 24 h', 'Suben / bajan', 'Peso de BTC'])
    // 1850 de capitalización, 170 de volumen; 2 suben, 2 bajan, 2 sin cambio; btc = 1000 / 1850.
    expect(texts('definition')).toEqual(['$1.85K', '$170.00', '2 / 2', '2 sin cambio', '54.1%'])
  })

  it('sin datos usa guiones y un nombre genérico para el líder', () => {
    render(<SummaryStrip summary={summarize([])} />)

    expect(texts('term')).toEqual(['Cap. total', 'Volumen 24 h', 'Suben / bajan', 'Peso del líder'])
    expect(texts('definition')).toEqual(['—', '—', '0 / 0', '—'])
  })

  it('es una región con nombre y las métricas son pares término/definición', () => {
    render(<SummaryStrip summary={summarize(SAMPLE_QUOTES)} />)

    expect(screen.getByRole('region', { name: 'Resumen del mercado' })).toBeInTheDocument()
  })
})