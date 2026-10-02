import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AppShell } from '@/components/layout/AppShell'
import { NotFoundPage } from '@/features/NotFoundPage'
import { AlertsPage } from '@/features/alerts/AlertsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { HistoryPage } from '@/features/history/HistoryPage'
import { MarketsPage } from '@/features/markets/MarketsPage'
import { PortfolioPage } from '@/features/portfolio/PortfolioPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { WatchlistPage } from '@/features/watchlist/WatchlistPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: 'markets',
        element: <MarketsPage />,
      },
      {
        path: 'portfolio',
        element: <PortfolioPage />,
      },
      {
        path: 'watchlist',
        element: <WatchlistPage />,
      },
      {
        path: 'alerts',
        element: <AlertsPage />,
      },
      {
        path: 'history',
        element: <HistoryPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
