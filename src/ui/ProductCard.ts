import type { Product } from "../interfaces/product.interface";

/**
 * Genera el HTML para una tarjeta de producto con estética moderna y glassmorphism.
 * @param product El objeto de producto mapeado desde el dominio.
 * @returns Un string de HTML listo para ser inyectado.
 */
export const renderProductCard = (product: Product): string => {
  // Lógica para el color del stock (Disponibilidad del Sistema)
  const stockColor = product.stock > 20 ? "text-emerald-400" : "text-rose-400";
  const stockBarWidth = `${Math.min(product.stock, 100)}%`;

  return `
    <article class="group relative bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl overflow-hidden transition-all duration-300 hover:border-[var(--brand-color)] hover:shadow-[0_0_25px_var(--glow-color)] flex flex-col h-full backdrop-blur-sm">
      
      <!-- Contenedor de Imagen con Overlay -->
      <div class="relative aspect-square overflow-hidden bg-[var(--panel-bg)] p-6">
        <img 
          src="${product.image}" 
          alt="${product.title}" 
          class="w-full h-full object-contain mix-blend-normal group-hover:scale-105 transition-all duration-500"
        />
        <div class="absolute top-2 right-2 bg-[var(--bg-color)] px-2 py-1 rounded border border-[var(--panel-border)]">
          <span class="text-[10px] font-mono text-[var(--brand-color)] uppercase tracking-tighter">ID: ${product.id.toString().padStart(4, "0")}</span>
        </div>
      </div>

      <!-- Cuerpo de la Card -->
      <div class="p-5 flex flex-col flex-1">
        <span class="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">${product.category}</span>
        <h3 class="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 mb-4 flex-1">
          ${product.title}
        </h3>

        <!-- Sección de Precio y Stock (Data-Driven) -->
        <div class="space-y-4">
          <div class="flex justify-between items-end">
            <div class="flex flex-col">
              <span class="text-[10px] text-[var(--text-secondary)] uppercase">Unit Price</span>
              <span class="text-2xl font-black text-[var(--brand-color)] tracking-tighter drop-shadow-[0_0_8px_var(--glow-color)]">
                $${product.price.toFixed(2)}
              </span>
            </div>
            
            <button class="bg-[var(--brand-color)] hover:brightness-110 text-[var(--bg-color)] p-2 rounded-lg transition-all cursor-pointer group/btn shadow-[0_0_10px_var(--glow-color)] hover:shadow-[0_0_15px_var(--glow-color)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            </button>
          </div>

          <!-- Indicador de Disponibilidad (Stock) -->
          <div class="pt-2 border-t border-[var(--panel-border)]">
            <div class="flex justify-between text-[9px] uppercase mb-1 font-mono">
              <span class="text-[var(--text-secondary)]">System Availability</span>
              <span class="${stockColor}">${product.stock} units</span>
            </div>
            <div class="w-full h-1 bg-[var(--bg-color)] rounded-full overflow-hidden">
              <div class="h-full bg-[var(--brand-color)] transition-all duration-1000 shadow-[0_0_8px_var(--glow-color)]" style="width: ${stockBarWidth}"></div>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
};
