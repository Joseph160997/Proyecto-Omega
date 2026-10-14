export type ClassValue = string | false | null | undefined

/** Une clases omitiendo valores vacíos: cx('a', condicion && 'b'). */
export function cx(...values: ClassValue[]): string {
  return values
    .filter((value): value is string => typeof value === 'string' && value !== '')
    .join(' ')
}
