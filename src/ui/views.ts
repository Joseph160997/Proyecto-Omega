export const renderMarketView = (): string => {
  return `
<section class="bg-slate-900/50 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
         
          <div class="p-6 border-b border-white/10 flex justify-between items-center bg-blue-500/5">
              <h2 class="text-2xl font-bold text-blue-400 tracking-tighter">Market Overview</h2>
              <span class="text-[10px] text-slate-500 uppercase tracking-widest font-black">Live Data Feed</span>
          </div>
           <div class="mb-6">
           <input type="text" id="crypto-search" placeholder="Search by name or symbol..." class="w-full bg-slate-800 text-slate-200 placeholder-slate-500 border border-slate-700 rounded-xl px-4 font-bold py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 transtition-colors duration-200"/>
          </div>
          <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead class="bg-white/5 text-slate-400 uppercase text-xs font-semibold">
                  <tr>
                    <th class="px-6 py-4">Asset</th>
                    <th class="px-6 py-4 text-right">Price</th>
                    <th class="px-6 py-4 text-right">24h Change</th>
                  </tr>
                </thead>
                <tbody id="crypto-table-body">
                  <tr><td colspan="3" class="px-6 py-12 text-center text-slate-500 animate-pulse">Initializing market stream...</td></tr>
                </tbody>
              </table>
          </div>
        </section>
`;
};

export const renderInventoryView = (): string => {
  return `
    <section>
          <div class="mb-6 flex justify-between items-end border-l-4 border-amber-500 pl-4">
            <div>
              <h2 class="text-2xl font-bold text-slate-100 uppercase tracking-tighter">System Inventory</h2>
              <p class="text-sm text-slate-500">Gestión de activos físicos y stock</p>
            </div>
            <div class="text-right">
              <span id="product-count" class="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">0 ITEMS SCANNING</span>
            </div>
          </div>

          <div class="mb-6 flex flex-col sm:flex-row gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm">
            <div class="flex-1">
              <label class="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Filter by Category</label>
              <select id="category-filter" class="w-full bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors cursor-pointer">
                <option value="all">// ALL_CATEGORIES</option>
                <option value="electronics">ELECTRONICS</option>
                <option value="jewelery">JEWELRY</option>
                <option value="men's clothing">MEN'S CLOTHING</option>
                <option value="women's clothing">WOMEN'S CLOTHING</option>
              </select>
            </div>

            <div class="w-full sm:w-48">
              <label class="block text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Sort by Price</label>
              <select id="price-sort" class="w-full bg-slate-950 text-slate-300 font-mono text-xs border border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-colors cursor-pointer">
                <option value="none">// DEFAULT_ORDER</option>
                <option value="asc">PRICE: LOW_TO_HIGH</option>
                <option value="desc">PRICE: HIGH_TO_LOW</option>
              </select>
            </div>
          </div>

          <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div class="col-span-full py-20 text-center text-slate-600 font-mono text-sm uppercase tracking-widest animate-pulse">
              Synchronizing inventory database...
            </div>
          </div>
    </section>`;
};

export const renderKanbanView = (): string => {
  return `
    <section class="pt-4 border-t border-white/5">
          <div class="mb-6 flex justify-between items-end border-l-4 border-emerald-500 pl-4">
            <div>
              <h2 class="text-2xl font-bold text-slate-100 uppercase tracking-tighter">Core Operations</h2>
              <p class="text-sm text-slate-500">Monitoreo de tareas y despliegues del sistema</p>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">PROD_ENV ACTIVE</span>
            </div>
          </div>
          <div id="kanban-container">
            <div class="py-12 text-center text-slate-600 font-mono text-sm uppercase tracking-widest animate-pulse">
              Loading core operational tasks...
            </div>
          </div>
    </section>`;
};
