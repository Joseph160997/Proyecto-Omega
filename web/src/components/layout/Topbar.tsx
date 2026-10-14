import { CandlestickChart, Moon, Search, Sun } from 'lucide-react'

import { useThemeStore } from '@/app/container'
import { DataStatusChip } from '@/features/markets/DataStatusChip'

export function Topbar() {
  const mode = useThemeStore((state) => state.mode)
  const toggle = useThemeStore((state) => state.toggle)

  return (
    <header className="flex h-16 items-center gap-3 border-b border-line bg-panel px-4 md:px-6">
      <div className="flex items-center gap-3 lg:hidden">
        <span className="flex size-9 items-center justify-center rounded-xl bg-accent-fill text-on-accent">
          <CandlestickChart size={18} aria-hidden="true" />
        </span>

        <p className="text-sm font-semibold text-fg">Omega Markets</p>
      </div>

      <button
        type="button"
        disabled
        title="Disponible próximamente"
        className="hidden w-80 items-center gap-2.5 rounded-full border border-line bg-canvas px-4 py-2 text-sm text-fg-subtle md:flex"
      >
        <Search size={16} aria-hidden="true" />
        Buscar activos, páginas o acciones…
        <kbd className="ml-auto rounded-md bg-raised px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">
          Ctrl K
        </kbd>
      </button>

      <div className="flex-1" />

      <DataStatusChip className="hidden sm:inline-flex" />

      <button
        type="button"
        onClick={toggle}
        aria-label={mode === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
        className="flex size-9 items-center justify-center rounded-xl border border-line text-fg-muted transition-colors hover:bg-raised hover:text-fg"
      >
        {mode === 'dark' ? (
          <Sun size={16} aria-hidden="true" />
        ) : (
          <Moon size={16} aria-hidden="true" />
        )}
      </button>
    </header>
  )
}
