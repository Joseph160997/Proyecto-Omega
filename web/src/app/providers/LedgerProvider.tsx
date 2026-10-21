import { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { getLedgerServices } from '@/app/container'
import { ledgerKeys } from '@/features/portfolio/ledgerKeys'
import { subscribeToLedgerChanges } from '@/services/storage/ledger/ledgerSync'

import type { PropsWithChildren } from 'react'
import type { LedgerRepositoryError } from '@/application/ledger/ports'
import type { LedgerServices } from '@/app/container'

type LedgerState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly services: LedgerServices }
  | { readonly status: 'error'; readonly error: LedgerRepositoryError; readonly retry: () => void }

const LedgerContext = createContext<LedgerState | null>(null)

export function LedgerProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<LedgerState>({ status: 'loading' })
  const [retryVersion, setRetryVersion] = useState(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToLedgerChanges(() => {
      void queryClient.invalidateQueries({ queryKey: ledgerKeys.snapshot() })
    })

    void getLedgerServices().then((result) => {
      if (!active) return

      setState(
        result.ok
          ? { status: 'ready', services: result.value }
          : {
              status: 'error',
              error: result.error,
              retry: () => {
                setState({ status: 'loading' })
                setRetryVersion((version) => version + 1)
              },
            },
      )
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [queryClient, retryVersion])

  return <LedgerContext.Provider value={state}>{children}</LedgerContext.Provider>
}

export function useLedger(): LedgerState {
  const state = useContext(LedgerContext)

  if (state === null) throw new Error('useLedger debe usarse dentro de LedgerProvider')

  return state
}
