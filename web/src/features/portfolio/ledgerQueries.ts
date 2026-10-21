import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { ledgerKeys } from '@/features/portfolio/ledgerKeys'
import { publishLedgerChange } from '@/services/storage/ledger/ledgerSync'

import type { LedgerRepositoryError, LedgerSnapshot } from '@/application/ledger/ports'
import type { LedgerServices } from '@/app/container'
import type { OrderRequest } from '@/application/ledger/placeOrder'
import type { Result } from '@/domain/shared/result'

export class LedgerOperationError extends Error {
  readonly repositoryError: LedgerRepositoryError

  constructor(repositoryError: LedgerRepositoryError) {
    super(`Ledger operation failed (${repositoryError.kind})`)
    this.name = 'LedgerOperationError'
    this.repositoryError = repositoryError
  }
}

export function ledgerSnapshotQueryOptions(services: LedgerServices) {
  return queryOptions({
    queryKey: ledgerKeys.snapshot(),
    queryFn: async () => {
      const result = await services.loadSnapshot()

      if (!result.ok) throw new LedgerOperationError(result.error)

      return result.value
    },
    ...(services.snapshot ? { initialData: services.snapshot, initialDataUpdatedAt: 0 } : {}),
  })
}

export function useLedgerSnapshot(services: LedgerServices) {
  return useQuery(ledgerSnapshotQueryOptions(services))
}

function useLedgerAction<TInput>(
  services: LedgerServices,
  action: (input: TInput) => Promise<Result<LedgerSnapshot, LedgerRepositoryError>>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: TInput) => {
      const result = await action(input)

      if (!result.ok) throw new LedgerOperationError(result.error)

      return result.value
    },
    onSuccess: (snapshot) => {
      queryClient.setQueryData(ledgerKeys.snapshot(), snapshot)

      if (services.persistent) publishLedgerChange()
    },
  })
}

export function useLedgerActions(services: LedgerServices) {
  const openAccount = useLedgerAction(services, () => services.openAccount())
  const resetAccount = useLedgerAction(services, () => services.resetAccount())
  const placeOrder = useLedgerAction(services, (request: OrderRequest) =>
    services.placeOrder(request),
  )

  return { openAccount, resetAccount, placeOrder }
}
