import { NavLink } from 'react-router-dom'
import { CandlestickChart } from 'lucide-react'

import { navItems } from '@/components/layout/nav-items'

export function Sidebar() {
  return (
    <aside
      className={[
        'group hidden h-screen w-16 shrink-0 overflow-hidden border-r border-(--border) bg-(--surface)',
        'transition-[width] duration-300 ease-in-out hover:w-64 focus-within:w-64',
        'motion-reduce:transition-none lg:sticky lg:top-0 lg:flex lg:flex-col',
      ].join(' ')}
    >
      <div className="flex h-16 items-center gap-3 border-b border-(--border) px-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--border) bg-(--bg) text-(--accent)">
          <CandlestickChart size={18} aria-hidden="true" />
        </span>

        <div className="hidden min-w-0 group-hover:block group-focus-within:block">
          <p className="truncate text-sm font-semibold text-(--text-primary)">Omega Markets</p>
          <p className="truncate text-xs text-(--text-secondary)">Terminal simulada</p>
        </div>
      </div>

      <nav
        aria-label="Navegación principal"
        className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-2"
      >
        {navItems.map(({ icon: Icon, ...item }) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            aria-label={item.label}
            title={item.label}
            className={({ isActive }) =>
              [
                'flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm transition-colors',
                'group-hover:justify-start group-focus-within:justify-start',
                isActive
                  ? 'bg-(--bg) text-(--text-primary) shadow-sm'
                  : 'text-(--text-secondary) hover:bg-(--bg) hover:text-(--text-primary)',
              ].join(' ')
            }
          >
            <Icon size={18} aria-hidden="true" className="shrink-0" />

            <span className="hidden min-w-0 group-hover:block group-focus-within:block">
              <span className="block truncate">{item.label}</span>
              <span className="block truncate text-xs text-(--text-secondary)">
                {item.description}
              </span>
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
