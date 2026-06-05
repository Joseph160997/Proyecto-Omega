import type { CryptoCurrency } from "../interfaces/crypto.interface";
import { filterCoins } from "../utils/filters";
import { renderCryptoTable } from "./crypto.table";

export const setupMarketSearch = (allCoins: CryptoCurrency[]): void => {
  const searchInput = document.getElementById(
    "crypto-search",
  ) as HTMLInputElement;

  if (!searchInput) return;

  searchInput.addEventListener("input", (event) => {
    const target = event.target as HTMLInputElement;
    const currentSearchTerm = target.value;

    const filteredCoins = filterCoins(allCoins, currentSearchTerm);
    renderCryptoTable("crypto-table-body", filteredCoins);
  });
};
