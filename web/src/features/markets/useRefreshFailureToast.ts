import { useEffect } from 'react'

import { describeMarketError } from '@/features/markets/marketErrors'
import { toast } from '@/stores/toast.store'

export const REFRESH_FAILURE_TOAST_ID = 'market-refresh-failure'

interface RefreshFailureToastParams {
  /** El refresco falló y ya había datos mostrados. */
  isRefetchError: boolean
  error: unknown
  refetch: () => Promise<unknown>
}

/** Anuncia una vez el fallo del refresco; el chip conserva el estado persistente. */
export function useRefreshFailureToast({
  isRefetchError,
  error,
  refetch,
}: RefreshFailureToastParams) {
  const description = isRefetchError ? describeMarketError(error) : null

  useEffect(() => {
    if (description === null) {
      toast.dismiss(REFRESH_FAILURE_TOAST_ID)
      return
    }

    toast.error({
      id: REFRESH_FAILURE_TOAST_ID,
      title: 'No se pudo actualizar el mercado',
      description,
      action: {
        label: 'Reintentar',
        onClick: () => {
          void refetch()
        },
      },
    })
  }, [description, refetch])

  useEffect(() => () => toast.dismiss(REFRESH_FAILURE_TOAST_ID), [])
}
