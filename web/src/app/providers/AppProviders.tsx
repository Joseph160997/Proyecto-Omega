import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { LedgerProvider } from '@/app/providers/LedgerProvider'
import { AppRouter } from '@/app/router/AppRouter'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export function AppProviders() {
  return (
    <QueryClientProvider client={queryClient}>
      <LedgerProvider>
        <AppRouter />
      </LedgerProvider>
    </QueryClientProvider>
  )
}
