import { CircleCheck, Info, TriangleAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { cx } from '@/lib/cx'
import { useToastStore } from '@/stores/toast.store'

import type { LucideIcon } from 'lucide-react'
import type { Toast, ToastVariant } from '@/application/notifications/toasts'

const VARIANTS: Record<ToastVariant, { Icon: LucideIcon; tone: string }> = {
  info: { Icon: Info, tone: 'text-info' },
  success: { Icon: CircleCheck, tone: 'text-up' },
  error: { Icon: TriangleAlert, tone: 'text-warning' },
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [paused, setPaused] = useState(false)
  const { Icon, tone } = VARIANTS[toast.variant]

  useEffect(() => {
    if (toast.duration === null || paused) return

    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)

    return () => clearTimeout(timer)
  }, [toast, paused, onDismiss])

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : undefined}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-line bg-raised p-4 shadow-lg motion-safe:animate-toast-in"
    >
      <Icon size={18} aria-hidden="true" className={cx('mt-0.5 shrink-0', tone)} />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">{toast.title}</p>

        {toast.description ? (
          <p className="mt-1 text-xs leading-relaxed text-fg-muted">{toast.description}</p>
        ) : null}

        {toast.action ? (
          <Button size="sm" className="mt-3" onClick={toast.action.onClick}>
            {toast.action.label}
          </Button>
        ) : null}
      </div>

      <button
        type="button"
        aria-label="Cerrar aviso"
        onClick={() => onDismiss(toast.id)}
        className="rounded-lg p-1 text-fg-muted transition-colors hover:bg-panel hover:text-fg"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div
      role="region"
      aria-label="Notificaciones"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-20 z-50 flex flex-col gap-2 sm:inset-x-auto sm:right-6 sm:w-96 lg:bottom-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}
