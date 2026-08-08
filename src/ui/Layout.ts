/**
 * Componente que genera la estructura base y el esqueleto de la aplicación.
 * Define el Header, el contenedor del Dashboard de Temas, y las secciones
 * vacías con sus IDs listos para recibir los datos de los módulos.
 * * @returns {string} El HTML completo del cascarón de la aplicación.
 */
export const renderLayout = (): string => {
  return `
    <header class="w-full p-6 border-b border-[var(--panel-border)] bg-[var(--panel-bg)] backdrop-blur-md sticky top-0 z-50 shadow-lg"> 
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold tracking-tighter text-[var(--brand-color)] drop-shadow-[0_0_8px_var(--glow-color)]">
          PROYECTO <span class="text-[var(--text-primary)]">OMEGA</span>
        </h1>
        <nav id="main-nav" class="flex items-center gap-6">
          <ul class="flex gap-6 text-sm uppercase tracking-wide">
            <li data-page="market" class="text-[var(--text-secondary)] hover:text-[var(--brand-color)] pb-1 cursor-pointer transition-colors duration-300">Market</li>
            <li data-page="inventory" class="text-[var(--text-secondary)] hover:text-[var(--brand-color)] pb-1 cursor-pointer transition-colors duration-300">Inventory</li>
            <li data-page="kanban" class="text-[var(--text-secondary)] hover:text-[var(--brand-color)] pb-1 cursor-pointer transition-colors duration-300">Kanban</li>
          </ul>
          
          <!-- Carrito con contador -->
          <button id="cart-toggle" class="relative ml-4 text-[var(--text-secondary)] hover:text-[var(--brand-color)] transition-colors" aria-label="Ver carrito">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span id="cart-count" class="absolute -top-2 -right-2 bg-[var(--brand-color)] text-[var(--bg-color)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_8px_var(--glow-color)]" style="display: none;">0</span>
          </button>
        </nav>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto p-6">
      
      <section class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[var(--panel-bg)] p-4 rounded-xl border border-[var(--panel-border)] shadow-lg backdrop-blur-sm">
        <div>
          <h2 class="text-xl font-bold text-[var(--text-primary)]">System Dashboard</h2>
          <p class="text-xs text-[var(--text-secondary)]">Configuración global y estado</p>
        </div>
        <div id="theme-buttons-container" class="flex gap-2 mt-4 sm:mt-0"></div>
      </section>

      <div id="content-view" class="grid grid-cols-1 gap-12">
        
       

      </div>
    </main>

    <!-- Panel lateral del carrito (oculto por defecto) -->
    <div id="cart-panel" class="fixed inset-y-0 right-0 w-80 bg-[var(--panel-bg)] border-l border-[var(--panel-border)] shadow-2xl transform translate-x-full transition-transform duration-300 z-50 backdrop-blur-xl" style="display: none;">
    </div>
    
    <!-- Overlay para el carrito -->
    <div id="cart-overlay" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" style="display: none;"></div>

    <footer class="w-full p-8 border-t border-[var(--panel-border)] text-center text-[var(--text-secondary)] text-xs">
      <p>&copy; 2026 Proyecto Omega - Built with Senior Mindset</p>
    </footer>
  `;
};
