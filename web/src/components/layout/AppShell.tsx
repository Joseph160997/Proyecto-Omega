import { Outlet } from 'react-router-dom'

import { MobileNav } from '@/components/layout/MobileNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { useApplyTheme } from '@/hooks/useApplyTheme'

export function AppShell() {
  useApplyTheme()

  return (
    <div className="flex min-h-screen bg-(--bg) text-(--text-primary)">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-(--surface) focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <MobileNav />

        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
