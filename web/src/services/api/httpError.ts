export type HttpError =
  | { kind: 'NETWORK_ERROR' }
  | { kind: 'TIMEOUT' }
  | { kind: 'RATE_LIMIT'; retryAfterMs?: number }
  | { kind: 'SERVER_ERROR'; status: number }
  | { kind: 'CLIENT_ERROR'; status: number }
  | { kind: 'INVALID_BODY' }
