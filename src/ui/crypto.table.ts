import type { CryptoCurrency } from "../interfaces/crypto.interface";
import { formatCurrency, formatPercentage } from "../utils/formatters";

/**
 * Renderiza la tabla de criptomonedas en el contenedor especificado.
 * @param containerId ID del elemento donde se insertará la tabla.
 * @param cryptos Lista de criptomonedas a mostrar en la tabla.
 * @returns void
 */
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
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
        : "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_8px_rgba(251,113,133,0.2)]";

      const arrow = coin.isPositive ? "▲" : "▼";

      return `
      <tr class="border-t border-[var(--panel-border)] hover:bg-[var(--brand-color)]/5 transition-all duration-200 hover:shadow-[0_2px_10px_var(--glow-color)]">
        <td class="px-6 py-4 flex items-center gap-3">
            <img src="${coin.image}" alt="${coin.name}" class="w-6 h-6 rounded-full shadow-md">
            <div>
                <p class="font-bold text-[var(--text-primary)] text-sm leading-tight">${coin.name}</p>
                <p class="text-[var(--text-secondary)] text-xs font-mono uppercase tracking-wider">${coin.symbol}</p>
            </div>
        </td>
        
        <td class="px-6 py-4 text-right font-mono text-sm text-[var(--text-primary)] font-medium">
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
