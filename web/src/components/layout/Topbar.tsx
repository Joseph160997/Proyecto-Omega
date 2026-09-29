import { CandlestickChart, Command, Moon, Sun } from 'lucide-react'

import { useThemeStore } from '@/stores/theme.store'

export function Topbar() {
  const mode = useThemeStore((state) => state.mode)
  const toggle = useThemeStore((state) => state.toggle)

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-(--border) bg-(--surface) px-4 md:px-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border) bg-(--bg) text-(--accent) lg:hidden">
          <CandlestickChart size={18} aria-hidden="true" />
        </span>

        <div>
          <p className="text-sm font-semibold text-(--text-primary)">
            Omega Markets
          </p>
          <p className="text-xs text-(--text-secondary)">
            Terminal financiera simulada
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          className="hidden items-center gap-2 rounded-lg border border-(--border) px-3 py-2 text-xs text-(--text-secondary) md:flex"
        >
          <Command size={14} aria-hidden="true" />
          Command palette
          <kbd className="rounded bg-(--bg) px-1 py-0.5 text-[10px]">
            Ctrl K
          </kbd>
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={
            mode === 'dark'
              ? 'Activar modo claro'
              : 'Activar modo oscuro'
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border) text-(--text-secondary) transition-colors hover:text-(--text-primary)"
        >
          {mode === 'dark' ? (
            <Sun size={16} aria-hidden="true" />
          ) : (
            <Moon size={16} aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  )
}