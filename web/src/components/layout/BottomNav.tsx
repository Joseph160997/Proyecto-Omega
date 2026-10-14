import { Ellipsis } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { matchPath, NavLink, useLocation } from 'react-router-dom'

import { barNavItems, moreNavItems } from '@/components/layout/nav-items'
import { cx } from '@/lib/cx'

const ITEM =
  'flex flex-1 flex-col items-center justify-center gap-1 px-2 text-[11px] font-medium transition-colors'

function MoreMenu() {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLLIElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const { pathname } = useLocation()

  const hasActiveChild = moreNavItems.some(
    (item) => matchPath({ path: item.to, end: item.end ?? false }, pathname) !== null,
  )

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <li ref={rootRef} className="relative flex flex-1">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-current={hasActiveChild ? 'true' : undefined}
        onClick={() => setOpen((current) => !current)}
        className={cx(
          ITEM,
          'w-full',
          hasActiveChild || open ? 'text-fg' : 'text-fg-muted hover:text-fg',
        )}
      >
        <Ellipsis size={20} aria-hidden="true" className={cx(hasActiveChild && 'text-accent')} />
        Más
      </button>

      {open ? (
        <ul
          id={panelId}
          className="absolute bottom-full right-2 mb-2 w-56 space-y-1 rounded-2xl border border-line bg-raised p-2 shadow-lg"
        >
          {moreNavItems.map(({ icon: Icon, ...item }) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                    isActive ? 'bg-panel text-fg' : 'text-fg-muted hover:bg-panel hover:text-fg',
                  )
                }
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-sidebar pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex h-16 items-stretch">
        {barNavItems.map(({ icon: Icon, ...item }) => (
          <li key={item.to} className="flex flex-1">
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cx(ITEM, isActive ? 'text-fg' : 'text-fg-muted hover:text-fg')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} aria-hidden="true" className={cx(isActive && 'text-accent')} />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}

        <MoreMenu key={pathname} />
      </ul>
    </nav>
  )
}
