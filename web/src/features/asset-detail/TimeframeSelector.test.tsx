// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TimeframeSelector } from '@/features/asset-detail/TimeframeSelector'

describe('TimeframeSelector', () => {
  it('exposes a named group and marks the selected period', () => {
    const onChange = vi.fn()

    render(<TimeframeSelector value="7d" onChange={onChange} />)

    expect(screen.getByRole('group', { name: 'Periodo del gráfico' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '7D' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '1D' })).toHaveAttribute('aria-pressed', 'false')
    expect(onChange).not.toHaveBeenCalled()
  })

  it.each([
    ['1D', '1d'],
    ['7D', '7d'],
    ['30D', '30d'],
    ['90D', '90d'],
    ['1A', '1y'],
  ] as const)('emits the %s timeframe when selected', async (label, timeframe) => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<TimeframeSelector value="7d" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: label }))

    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(timeframe)
  })
})
