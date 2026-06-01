import { storage } from "../services/storage";

/**
 * Obtiene datos de una API, los mapea al dominio y los guarda en IndexedDB.
 * Si la red falla, intenta devolver la última copia cacheada.
 */
export async function fetchWithCache<TRaw, TDomain>(
  url: string,
  cacheKey: string,
  mapperFn: (data: TRaw) => TDomain,
  options?: RequestInit,
): Promise<TDomain> {
  if (!url || url.includes("undefined")) {
    throw new Error(
      `URL inválida para "${cacheKey}". Revisa tu archivo .env y reinicia el servidor.`,
    );
  }

  let rawData: TRaw;

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al consultar ${cacheKey}`);
    }
    rawData = (await response.json()) as TRaw;
  } catch (networkError) {
    console.warn(
      `[Omega] Red falló para "${cacheKey}", buscando caché local...`,
      networkError,
    );

    try {
      const cachedData = await storage.get(cacheKey);
      if (cachedData) return cachedData as TDomain;
    } catch (cacheError) {
      console.warn("[Omega] IndexedDB no disponible:", cacheError);
    }

    throw networkError;
  }

  let cleanData: TDomain;
  try {
    cleanData = mapperFn(rawData);
  } catch (mapError) {
    console.error(
      `[Omega] Error al transformar datos de "${cacheKey}":`,
      mapError,
    );
    throw mapError;
  }

  try {
    await storage.save(cacheKey, cleanData);
  } catch (cacheError) {
    console.warn(
      `[Omega] Datos recibidos pero no se pudieron guardar en IndexedDB (${cacheKey}):`,
      cacheError,
    );
  }

  return cleanData;
}
