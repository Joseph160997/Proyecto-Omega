import type { CryptoCurrency } from "../interfaces/crypto.interface";
import { formatCurrency, formatPercentage } from "../utils/formatters";

export const renderCryptoTable = (
  containerId: string,
  cryptos: CryptoCurrency[],
): void => {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`No contenedor: ${containerId}`);
    return;
  }

  container.innerHTML = cryptos
    .map((coin) => {
      // Clases y símbolos dinámicos basados en la propiedad que calculó el Mapper
      const badgeClass = coin.isPositive
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-rose-500/10 text-rose-400 border-rose-500/20";

      const arrow = coin.isPositive ? "▲" : "▼";

      return `
      <tr class="border-t border-white/5 hover:bg-white/2 transition-colors duration-200">
        <td class="px-6 py-4 flex items-center gap-3">
            <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6 rounded-full shadow-md">
            <div>
                <p class="font-bold text-slate-100 text-sm leading-tight">${coin.name}</p>
                <p class="text-slate-500 text-xs font-mono uppercase tracking-wider">${coin.symbol}</p>
            </div>
        </td>
        
        <td class="px-6 py-4 text-right font-mono text-sm text-slate-200 font-medium">
          ${formatCurrency(coin.price)}
        </td>

        <td class="px-6 py-4 text-right">
          <span class="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${badgeClass}">
            <span class="text-[9px]">${arrow}</span>
            ${formatPercentage(coin.change24h)}
          </span>
        </td>
      </tr>`;
    })
    .join("");
};
