import { RouteErrorPage } from '@/components/feedback/RouteErrorPage'
import { AppShell } from '@/components/layout/AppShell'
import { AlertsPage } from '@/features/alerts/AlertsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { MarketsPage } from '@/features/markets/MarketsPage'
import { NotFoundPage } from '@/features/NotFoundPage'
import { PortfolioPage } from '@/features/portfolio/PortfolioPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { WatchlistPage } from '@/features/watchlist/WatchlistPage'

import type { RouteObject } from 'react-router-dom'

/**
 * Las rutas de la app, separadas de la creación del router para poder probarlas
 * (createBrowserRouter necesita un navegador real).
 */
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'markets', element: <MarketsPage /> },
          { path: 'portfolio', element: <PortfolioPage /> },
          { path: 'watchlist', element: <WatchlistPage /> },
          { path: 'alerts', element: <AlertsPage /> },
          { path: 'history', element: <HistoryPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]
