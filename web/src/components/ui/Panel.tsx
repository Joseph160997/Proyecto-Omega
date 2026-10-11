import { cx } from '@/lib/cx'

import type { HTMLAttributes } from 'react'

type PanelPadding = 'none' | 'sm' | 'md'

// Clases completas, nunca construidas con texto: Tailwind las detecta leyendo el código.
const PADDING: Record<PanelPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
}

interface PanelProps extends HTMLAttributes<HTMLElement> {
  /** Etiqueta HTML a usar: elige la semántica correcta (section, article...). */
  as?: 'div' | 'section' | 'article'
  padding?: PanelPadding
}

export function Panel({ as: Tag = 'div', padding = 'md', className, ...rest }: PanelProps) {
  return (
    <Tag
      className={cx(
        'rounded-card border border-line bg-panel shadow-card',
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  )
}
