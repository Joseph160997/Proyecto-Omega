/** Milisegundos desde 1970. Inyectable para que los tests controlen el tiempo. */
export type Clock = () => number

/** Genera ids de asiento únicos. Inyectable para que los tests sean deterministas. */
export type NewId = () => string
