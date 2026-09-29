import { PageHeader } from '@/components/layout/PageHeader'
import { useThemeStore } from '@/stores/theme.store'

import type { ThemeMode } from '@/stores/theme.store'

const themeOptions: Array<{
  value: ThemeMode
  label: string
  description: string
}> = [
  {
    value: 'dark',
    label: 'Oscuro',
    description: 'Terminal financiera elegante',
  },
  {
    value: 'light',
    label: 'Claro',
    description: 'Fintech limpia',
  },
]

export function SettingsPage() {
  const mode = useThemeStore((state) => state.mode)
  const setMode = useThemeStore((state) => state.setMode)

  return (
    <section className="space-y-6">
      <PageHeader
        title="Settings"
        description="Preferencias visuales y de simulación."
      />

      <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
        <h2 className="text-sm font-medium text-(--text-primary)">
          Tema
        </h2>

        <p className="mt-1 text-sm text-(--text-secondary)">
          Selecciona el modo visual de Omega Markets.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={[
                'min-w-40 rounded-xl border px-4 py-3 text-left transition-colors',
                mode === option.value
                  ? 'border-(--accent) bg-(--bg) text-(--text-primary)'
                  : 'border-(--border) text-(--text-secondary) hover:text-(--text-primary)',
              ].join(' ')}
            >
              <span className="block text-sm font-medium">
                {option.label}
              </span>

              <span className="mt-1 block text-xs text-(--text-secondary)">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}