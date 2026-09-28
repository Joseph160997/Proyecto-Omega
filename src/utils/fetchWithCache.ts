import { storage } from "../services/storage";

/**
 * Obtiene datos de una API con validación de URL, tiempo de espera (timeout),
 * tipado estricto y fallback a caché local.
 */
export async function fetchWithCache<TRaw, TDomain>(
  url: string,
  cacheKey: string,
  mapperFn: (data: TRaw) => TDomain,
  options?: RequestInit,
  timeoutMs: number = 8000, // Timeout por defecto de 8 segundos
): Promise<TDomain> {
  // 1. Mejora: Validación de URL usando el constructor nativo [4]
  try {
    new URL(url);
  } catch (e) {
    throw new Error(
      `URL inválida para "${cacheKey}": ${url}. Verifique su configuración.`,
    );
  }

  // 2. Mejora: Implementación de Timeout con AbortController [1, 4]
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Realizar la petición con la señal de aborto
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    // Limpiar el timeout si la respuesta llega a tiempo
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: Error al consultar ${cacheKey}`,
      );
    }

    const rawData = (await response.json()) as TRaw;

    // 3. Mejora: Validación manual (sustituyendo a Zod) [5, 6]
    // Verificamos que los datos no sean nulos o indefinidos antes de mapear
    if (
      !rawData ||
      (typeof rawData === "object" && Object.keys(rawData).length === 0)
    ) {
      throw new Error(
        `Los datos recibidos de ${cacheKey} están vacíos o corruptos.`,
      );
    }

    const cleanData = mapperFn(rawData);

    // Guardar en caché de forma asíncrona [2]
    try {
      await storage.save(cacheKey, cleanData);
    } catch (cacheError) {
      console.warn(`[Caché] No se pudo guardar ${cacheKey}:`, cacheError);
    }

    return cleanData;
  } catch (error: unknown) {
    // 4. Mejora: Manejo de errores con tipos específicos [7, 8]
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.warn(
          `[Timeout] La petición para ${cacheKey} excedió el tiempo límite.`,
        );
      } else {
        console.warn(
          `[Red] Falló la petición para ${cacheKey}:`,
          error.message,
        );
      }
    }

    // Fallback: Intentar recuperar de IndexedDB (storage)
    try {
      const cachedData = await storage.get(cacheKey);
      if (cachedData) {
        console.info(`[Caché] Sirviendo copia local de "${cacheKey}"`);
        return cachedData as TDomain;
      }
    } catch (cacheError) {
      console.error(
        "[Caché] Error crítico al acceder a IndexedDB:",
        cacheError,
      );
    }

    // Si no hay red ni caché, lanzamos el error original
    throw error;
  }
}
