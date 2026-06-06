import type { CryptoCurrency } from "../interfaces/crypto.interface";
import { filterCoins } from "../utils/filters";
import { renderCryptoTable } from "./crypto.table";

/**
 * Configura la funcionalidad de búsqueda en el mercado de criptomonedas.
 * @param allCoins Una lista completa de criptomonedas que se utilizará para filtrar los resultados de búsqueda. Debe ser un array válido de objetos CryptoCurrency.
 * @returns No devuelve ningún valor. La función se encarga de agregar un event listener al campo de búsqueda y actualizar la tabla de criptomonedas en función del término de búsqueda ingresado por el usuario.
 * @throws Si el elemento de entrada de búsqueda no se encuentra en el DOM, la función simplemente no hará nada.
 */
export const setupMarketSearch = (allCoins: CryptoCurrency[]): void => {
  const searchInput = document.getElementById(
    "crypto-search",
  ) as HTMLInputElement;
  let debounceTimeout: number | undefined;

  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    const currentSearchTerm = target.value;

    // Limpiar el timeout de debounce anterior
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    // Establecer un nuevo timeout de debounce
    debounceTimeout = window.setTimeout(() => {
      const filteredCoins = filterCoins(allCoins, currentSearchTerm);
      renderCryptoTable("crypto-table-body", filteredCoins);
    }, 300); // 300 ms de retraso
  });
};
