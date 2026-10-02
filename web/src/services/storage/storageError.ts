export type StorageError =
  | { kind: 'NOT_FOUND' }
  | { kind: 'CORRUPT_JSON' }
  | { kind: 'SCHEMA_MISMATCH'; issues: string[] }
  | { kind: 'QUOTA_EXCEEDED' }
  | { kind: 'UNAVAILABLE'; cause?: unknown }
