import type { CryptoCurrency } from "../interfaces/crypto.interface";

/**
 * Función para filtrar una lista de criptomonedas basada en un término de búsqueda.
 * @param coins Una lista de criptomonedas que se desea filtrar.
 * @param searchTerm El término de búsqueda que se utilizará para filtrar las criptomonedas. Puede ser parte del nombre o del símbolo de la moneda.
 * @returns Una nueva lista de criptomonedas que contienen solo las criptomonedas que coinciden con el término de búsqueda.
 */
export const filterCoins = (
  coins: CryptoCurrency[],
  searchTerm: string,
): CryptoCurrency[] => {
  if (!searchTerm) return coins; // Si no hay término de búsqueda, devolvemos todas las monedas

  const lowerCaseSearchTerm = searchTerm.toLowerCase(); // Convertimos el término de búsqueda a minúsculas para una comparación insensible a mayúsculas

  return coins.filter((coin) => {
    const nameMatches = coin.name.toLowerCase().includes(lowerCaseSearchTerm); // Verificamos si el nombre de la moneda incluye el término de búsqueda
    const symbolMatches = coin.symbol
      .toLowerCase()
      .includes(lowerCaseSearchTerm); // Verificamos si el símbolo de la moneda incluye el término de búsqueda
    return nameMatches || symbolMatches; // Devolvemos true si el nombre o el símbolo coinciden con el término de búsqueda
  });
};
