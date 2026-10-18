import { depositEntry } from '@/domain/ledger/entries'
import { Money } from '@/domain/shared/money'
import { err, ok } from '@/domain/shared/result'

import type { Clock, NewId } from '@/application/ledger/deps'
import type {
  LedgerRepository,
  LedgerRepositoryError,
  LedgerSnapshot,
} from '@/application/ledger/ports'
import type { Result } from '@/domain/shared/result'

/** El dinero ficticio con el que empieza cada cuenta. */
export const INITIAL_CASH = Money.usd('10000')

export interface AccountDeps {
  readonly repository: LedgerRepository
  readonly now: Clock
  readonly newId: NewId
}

export type AccountResult = Promise<Result<LedgerSnapshot, LedgerRepositoryError>>

/**
 * Abre la cuenta: un único depósito inicial. "Solo si el libro está vacío" se decide dentro
 * de `append`: si dos pestañas lo intentan a la vez, una gana y la otra recibe
 * ACCOUNT_ALREADY_OPEN. Comprobarlo antes, en un paso aparte, dejaría pasar los dos.
 */
export function createOpenAccount({ repository, now, newId }: AccountDeps): () => AccountResult {
  return () =>
    repository.append((state) =>
      state.entryCount > 0
        ? err({ kind: 'ACCOUNT_ALREADY_OPEN' })
        : ok(depositEntry(newId(), INITIAL_CASH, now())),
    )
}

/**
 * Borra todo y abre una cuenta nueva. Son dos pasos: si la pestaña se cierra en medio, queda
 * un libro vacío, y la app simplemente ofrece abrir la cuenta otra vez (no se pierde nada
 * que no se hubiera borrado ya a propósito).
 */
export function createResetAccount(deps: AccountDeps): () => AccountResult {
  const open = createOpenAccount(deps)

  return async () => {
    const reset = await deps.repository.reset()

    return reset.ok ? open() : err(reset.error)
  }
}
