import { Outlet } from 'react-router-dom'

import { AppFooter } from '@/components/layout/AppFooter'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { Toaster } from '@/components/ui/Toaster'
import { useApplyTheme } from '@/hooks/useApplyTheme'

export function AppShell() {
  useApplyTheme()

  return (
    <div className="flex min-h-screen bg-canvas bg-atmosphere text-fg">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Saltar al contenido principal
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <Topbar />

        <main id="main-content" className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>

        <AppFooter />
      </div>

      <BottomNav />
      <Toaster />
    </div>
  )
}
