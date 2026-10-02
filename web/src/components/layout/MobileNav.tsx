import { NavLink } from 'react-router-dom'

import { navItems } from '@/components/layout/nav-items'

export function MobileNav() {
  return (
    <div className="border-b border-(--border) bg-(--surface) lg:hidden">
      <nav aria-label="Navegación móvil" className="flex gap-1 overflow-x-auto px-4 py-2">
        {navItems.map(({ icon: Icon, ...item }) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                isActive
                  ? 'bg-(--bg) text-(--text-primary)'
                  : 'text-(--text-secondary) hover:bg-(--bg) hover:text-(--text-primary)',
              ].join(' ')
            }
          >
            <Icon size={14} aria-hidden="true" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
