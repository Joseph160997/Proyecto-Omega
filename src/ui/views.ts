export const renderMarketView = (): string => {
  return `
<section class="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
         
          <div class="p-6 border-b border-[var(--panel-border)] flex justify-between items-center bg-[var(--brand-color)]/5">
              <h2 class="text-2xl font-bold text-[var(--brand-color)] tracking-tighter drop-shadow-[0_0_8px_var(--glow-color)]">Market Overview</h2>
              <span class="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-black">Live Data Feed</span>
          </div>
           <div class="mb-6">
           <input type="text" id="crypto-search" placeholder="Search by name or symbol..." class="w-full bg-[var(--bg-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] border border-[var(--panel-border)] rounded-xl px-4 font-bold py-3 focus:outline-none focus:border-[var(--brand-color)] focus:ring-2 focus:ring-[var(--glow-color)] transition-all duration-200"/>
          </div>
          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-[var(--bg-color)] text-[var(--text-secondary)] uppercase text-xs font-semibold">
                  <tr>
                    <th class="px-6 py-4">Asset</th>
                    <th class="px-6 py-4 text-right">Price</th>
                    <th class="px-6 py-4 text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody id="crypto-table-body">
                  <tr><td colspan="3" class="px-6 py-12 text-center text-[var(--text-secondary)] animate-pulse">Initializing market stream...</td></tr>
                </tbody>
              </table>
          </div>
        </section>
`;
};

export const renderInventoryView = (): string => {
  return `
    <section>
          <div class="mb-6 flex justify-between items-end border-l-4 border-[var(--brand-color)] pl-4">
            <div>
              <h2 class="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tighter">System Inventory</h2>
              <p class="text-sm text-[var(--text-secondary)]">Gestión de activos físicos y stock</p>
            </div>
            <div class="text-right">
              <span id="product-count" class="text-xs font-mono text-[var(--brand-color)] bg-[var(--brand-color)]/10 px-2 py-1 rounded border border-[var(--brand-color)]/30 shadow-[0_0_8px_var(--glow-color)]">0 ITEMS SCANNING</span>
            </div>
          </div>

          <div class="mb-6 flex flex-col sm:flex-row gap-4 bg-[var(--panel-bg)] p-4 rounded-xl border border-[var(--panel-border)] backdrop-blur-sm">
            <div class="flex-1">
              <label class="block text-[10px] font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Filter by Category</label>
              <select id="category-filter" class="w-full bg-[var(--bg-color)] text-[var(--text-primary)] font-mono text-xs border border-[var(--panel-border)] rounded px-3 py-2 focus:outline-none focus:border-[var(--brand-color)] focus:ring-1 focus:ring-[var(--glow-color)] transition-all cursor-pointer">
                <option value="all">// ALL_CATEGORIES</option>
                <option value="electronics">ELECTRONICS</option>
                <option value="jewelery">JEWELRY</option>
                <option value="men's clothing">MEN'S CLOTHING</option>
                <option value="women's clothing">WOMEN'S CLOTHING</option>
              </select>
            </div>

            <div class="w-full sm:w-48">
              <label class="block text-[10px] font-mono font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-1.5">Sort by Price</label>
              <select id="price-sort" class="w-full bg-[var(--bg-color)] text-[var(--text-primary)] font-mono text-xs border border-[var(--panel-border)] rounded px-3 py-2 focus:outline-none focus:border-[var(--brand-color)] focus:ring-1 focus:ring-[var(--glow-color)] transition-all cursor-pointer">
                <option value="none">// DEFAULT_ORDER</option>
                <option value="asc">PRICE: LOW_TO_HIGH</option>
                <option value="desc">PRICE: HIGH_TO_LOW</option>
              </select>
            </div>
          </div>

          <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div class="col-span-full py-20 text-center text-[var(--text-secondary)]/50 font-mono text-sm uppercase tracking-widest animate-pulse">
              Synchronizing inventory database...
            </div>
          </div>
    </section>`;
};

export const renderKanbanView = (): string => {
  return `
    <section class="pt-4 border-t border-[var(--panel-border)]">
          <div class="mb-6 flex justify-between items-end border-l-4 border-[var(--brand-color)] pl-4">
            <div>
              <h2 class="text-2xl font-bold text-[var(--text-primary)] uppercase tracking-tighter">Core Operations</h2>
              <p class="text-sm text-[var(--text-secondary)]">Monitoreo de tareas y despliegues del sistema</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono text-[var(--brand-color)] bg-[var(--brand-color)]/10 px-2 py-1 rounded border border-[var(--brand-color)]/30 shadow-[0_0_8px_var(--glow-color)]">PROD_ENV ACTIVE</span>
            </div>
          </div>
          <div id="kanban-container">
            <div class="py-12 text-center text-[var(--text-secondary)]/50 font-mono text-sm uppercase tracking-widest animate-pulse">
              Loading core operational tasks...
            </div>
          </div>
    </section>`;
};
