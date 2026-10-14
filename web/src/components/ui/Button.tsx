import { cx } from '@/lib/cx'

import type { ComponentProps, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-fill text-on-accent hover:brightness-110',
  secondary: 'border border-line bg-panel text-fg-muted hover:bg-raised hover:text-fg',
  ghost: 'text-fg-muted hover:bg-raised hover:text-fg',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Hay una acción en curso: deshabilita el botón y lo marca como ocupado. */
  loading?: boolean
  leadingIcon?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  leadingIcon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(BASE, VARIANTS[variant], SIZES[size], className)}
      {...rest}
    >
      {leadingIcon}
      {children}
    </button>
  )
}
