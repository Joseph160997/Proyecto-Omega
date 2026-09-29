import { NavLink } from 'react-router-dom'
import { CandlestickChart } from 'lucide-react'

import { navItems } from '@/components/layout/nav-items'

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-(--border) bg-(--surface) lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-(--border) px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-(--border) bg-(--bg) text-(--accent)">
          <CandlestickChart size={18} aria-hidden="true" />
        </span>

        <div>
          <p className="text-sm font-semibold text-(--text-primary)">
            Omega Markets
          </p>
          <p className="text-xs text-(--text-secondary)">
            Terminal simulada
          </p>
        </div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-1 overflow-y-auto p-3"
      >
        {navItems.map(({ icon: Icon, ...item }) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex items-start gap-3 rounded-xl px-3 py-3 text-sm transition-colors',
                isActive
                  ? 'bg-(--bg) text-(--text-primary) shadow-sm'
                  : 'text-(--text-secondary) hover:bg-(--bg) hover:text-(--text-primary)',
              ].join(' ')
            }
          >
            <Icon size={16} aria-hidden="true" className="mt-0.5 shrink-0" />

            <span className="flex flex-col">
              <span>{item.label}</span>
              <span className="text-xs text-(--text-secondary)">
                {item.description}
              </span>
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-(--border) p-4">
        <p className="text-xs text-(--text-secondary)">
          Simulación sin dinero real.
        </p>
      </div>
    </aside>
  )
}