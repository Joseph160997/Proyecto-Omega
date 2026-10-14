import { create } from 'zustand'

import { addToast, createToast, dismissToast } from '@/application/notifications/toasts'

import type { Toast, ToastInput } from '@/application/notifications/toasts'

interface ToastState {
  toasts: readonly Toast[]
  /** Muestra un aviso y devuelve su id. */
  show: (input: ToastInput) => string
  dismiss: (id: string) => void
}

export function createToastStore() {
  let counter = 0

  return create<ToastState>()((set) => ({
    toasts: [],

    show: (input) => {
      counter += 1
      const id = input.id ?? `toast-${counter}`

      set((state) => ({ toasts: addToast(state.toasts, createToast(input, id)) }))

      return id
    },

    dismiss: (id) => set((state) => ({ toasts: dismissToast(state.toasts, id) })),
  }))
}

export const useToastStore = createToastStore()

type ShortcutInput = Omit<ToastInput, 'variant'>

/** Atajos para mostrar avisos desde cualquier sitio, también fuera de componentes. */
export const toast = {
  info: (input: ShortcutInput) => useToastStore.getState().show({ ...input, variant: 'info' }),
  success: (input: ShortcutInput) =>
    useToastStore.getState().show({ ...input, variant: 'success' }),
  error: (input: ShortcutInput) => useToastStore.getState().show({ ...input, variant: 'error' }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
}
