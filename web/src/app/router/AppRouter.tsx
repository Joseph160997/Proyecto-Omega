import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { routes } from '@/app/router/routes'

const router = createBrowserRouter(routes)

export function AppRouter() {
  return <RouterProvider router={router} />
}
