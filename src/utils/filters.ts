import type { CryptoCurrency } from "../interfaces/crypto.interface";

/**
 * Función para filtrar una lista de criptomonedas basada en un término de búsqueda.
 * La función es insensible a mayúsculas/minúsculas.
 * @param coins Una lista de criptomonedas que se desea filtrar. Debe ser un array válido.
 * @param searchTerm El término de búsqueda que se utilizará para filtrar las criptomonedas. Puede ser parte del nombre o del símbolo de la moneda.
 * @returns Una nueva lista de criptomonedas que contienen solo las criptomonedas que coinciden con el término de búsqueda.
 * Si el término de búsqueda está vacío, devuelve todas las monedas.
 */
export const filterCoins = (
  coins: CryptoCurrency[],
  searchTerm: string,
): CryptoCurrency[] => {
  // Validar que coins sea un array válido
  if (!Array.isArray(coins)) {
    throw new Error("El parámetro 'coins' debe ser un array válido.");
  }

  // Si no hay término de búsqueda, devolvemos todas las monedas
  if (!searchTerm) return coins;

  // Convertir el término de búsqueda a minúsculas una sola vez
  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  // Filtrar las monedas basadas en el término de búsqueda
  return coins.filter((coin) => {
    // Verificar si el nombre o el símbolo de la moneda incluyen el término de búsqueda
    // Usar operador ?. para manejar posibles valores null o undefined
    const nameMatches = coin.name?.toLowerCase().includes(lowerCaseSearchTerm);
    const symbolMatches = coin.symbol
      ?.toLowerCase()
      .includes(lowerCaseSearchTerm);

    return nameMatches || symbolMatches;
  });
};
