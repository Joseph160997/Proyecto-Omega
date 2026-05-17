import type { CryptoCurrency } from "../interfaces/crypto.interface";
import { formatPercentage } from "../utils/formatters";

export const renderCryptoTable = (
  containerId: string,
  cryptos: CryptoCurrency[],
): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(
      `No se encontró el contenedor con id ${containerId} para renderizar la tabla de criptomonedas.`,
    );
    return;
  }

  container.innerHTML = cryptos
    .map((coin) => {
      const isPositive = coin.change24h >= 0;
      const colorClass = isPositive ? "text-green-500" : "text-red-500";

      return `<tr class="border-t border-white-/5 hover:bg-white/2 transition-colors">
        <td class="px-6 py-4 flex items-center gap-4">
            <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6 rounded-full">
            <div>
                <p class="font-bold text-slate-100 text-sm">${coin.name}</p>
                <p class="text-slate-400 text-xs uppercase">${coin.symbol}</p>
            </div>
        </td>
        <td class="px-6 py-4 text-right font-mono ${colorClass} font-medium">
          ${formatPercentage(coin.change24h)}
        </td>
        </tr>`;
    })
    .join("");
};
