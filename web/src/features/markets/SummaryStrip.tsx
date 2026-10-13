
import { Panel } from '@/components/ui/Panel'
import { formatCompactUsd, formatShare } from '@/lib/format'

import type { MarketSummary } from '@/features/markets/marketStatsLogic'

interface Metric {
  label: string
  value: string
  note?: string
}

function metricsOf(summary: MarketSummary): Metric[] {
  const { leader } = summary

  return [
    {
      label: 'Cap. total',
      value: formatCompactUsd(summary.totalMarketCap > 0 ? summary.totalMarketCap : undefined),
    },
    {
      label: 'Volumen 24 h',
      value: formatCompactUsd(summary.totalVolume24h > 0 ? summary.totalVolume24h : undefined),
    },
    {
      label: 'Suben / bajan',
      value: `${summary.rising} / ${summary.falling}`,
      note: summary.flat > 0 ? `${summary.flat} sin cambio` : undefined,
    },
    {
      label: leader === undefined ? 'Peso del líder' : `Peso de ${leader.symbol}`,
      value: formatShare(leader?.share),
    },
  ]
}

interface SummaryStripProps {
  summary: MarketSummary
}

export function SummaryStrip({ summary }: SummaryStripProps) {
  return (
    <section aria-label="Resumen del mercado">
      <p className="mb-2 text-xs text-fg-muted">
        Resumen de los {summary.assetCount} activos cargados
      </p>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricsOf(summary).map((metric) => (
          <Panel key={metric.label} padding="sm" className="space-y-1">
            <dt className="text-xs uppercase tracking-wide text-fg-muted">{metric.label}</dt>
            <dd className="font-mono text-2xl font-semibold tabular-nums">{metric.value}</dd>
            {metric.note ? <dd className="text-xs text-fg-muted">{metric.note}</dd> : null}
          </Panel>
        ))}
      </dl>
    </section>
  )
}