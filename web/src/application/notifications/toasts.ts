export type ToastVariant = 'info' | 'success' | 'error'

export interface ToastAction {
  readonly label: string
  readonly onClick: () => void
}

export interface ToastInput {
  /** Con un id fijo, mostrar otra vez el mismo aviso lo reemplaza en vez de apilarlo. */
  readonly id?: string
  readonly variant?: ToastVariant
  readonly title: string
  readonly description?: string
  readonly action?: ToastAction
  /** Milisegundos hasta cerrarse solo; null = no se cierra solo. Por defecto depende de la variante. */
  readonly duration?: number | null
}

export interface Toast {
  readonly id: string
  readonly variant: ToastVariant
  readonly title: string
  readonly description?: string
  readonly action?: ToastAction
  readonly duration: number | null
}

export const MAX_TOASTS = 3
export const AUTO_DISMISS_MS = 5_000

/** Los errores esperan al usuario; lo demás se cierra solo. */
export function defaultDuration(variant: ToastVariant): number | null {
  return variant === 'error' ? null : AUTO_DISMISS_MS
}

export function createToast(input: ToastInput, id: string): Toast {
  const variant = input.variant ?? 'info'
  const { duration } = input
  const valid =
    duration === null || (typeof duration === 'number' && Number.isFinite(duration) && duration > 0)

  return {
    id,
    variant,
    title: input.title,
    description: input.description,
    action: input.action,
    duration: valid ? duration : defaultDuration(variant),
  }
}

/** Añade al final, reemplaza ids repetidos en su sitio y descarta los avisos más antiguos. */
export function addToast(toasts: readonly Toast[], toast: Toast): Toast[] {
  const index = toasts.findIndex((current) => current.id === toast.id)
  const next =
    index === -1 ? [...toasts, toast] : toasts.map((current, i) => (i === index ? toast : current))

  return next.slice(-MAX_TOASTS)
}

export function dismissToast(toasts: readonly Toast[], id: string): Toast[] {
  return toasts.filter((toast) => toast.id !== id)
}
