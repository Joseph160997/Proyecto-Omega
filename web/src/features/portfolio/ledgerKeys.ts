export const ledgerKeys = {
  all: ['ledger'] as const,
  snapshot: () => ['ledger', 'snapshot'] as const,
}
