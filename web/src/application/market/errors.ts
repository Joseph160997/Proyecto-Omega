export type MarketDataError =
  | { kind: 'NETWORK_ERROR' }
  | { kind: 'TIMEOUT' }
  | { kind: 'RATE_LIMIT'; retryAfterMs?: number }
  | { kind: 'PROVIDER_UNAVAILABLE' }
  | { kind: 'INVALID_RESPONSE' }
