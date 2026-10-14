import { PageHeader } from '@/components/layout/PageHeader'
import { Panel } from '@/components/ui/Panel'
import { cx } from '@/lib/cx'
import { useThemeStore } from '@/app/container'

import type { ThemeMode } from '@/domain/settings/theme'

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
      <PageHeader title="Settings" description="Preferencias visuales y de simulación." />

      <Panel>
        <h2 className="text-sm font-medium text-fg">Tema</h2>

        <p className="mt-1 text-sm text-fg-muted">Selecciona el modo visual de Omega Markets.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {themeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMode(option.value)}
              aria-pressed={mode === option.value}
              className={cx(
                'min-w-40 rounded-xl border px-4 py-3 text-left transition-colors',
                mode === option.value
                  ? 'border-accent bg-raised text-fg'
                  : 'border-line text-fg-muted hover:bg-raised hover:text-fg',
              )}
            >
              <span className="block text-sm font-medium">{option.label}</span>

              <span className="mt-1 block text-xs text-fg-muted">{option.description}</span>
            </button>
          ))}
        </div>
      </Panel>
    </section>
  )
}
