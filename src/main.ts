import "./style.css";
import { themeService } from "./services/theme";
import { CryptoService } from "./services/crypto.services";
import { renderCryptoTable } from "./ui/crypto.table";
import { ProductService } from "./services/product.services";
import { renderProductCard } from "./ui/ProductCard";
import { TaskStorageService } from "./services/task.service";
// ==========================================
// NUEVAS IMPORTACIONES (MÓDULO KANBAN)
// ==========================================

import { renderTaskBoard } from "./ui/TaskBoard";

themeService.init();

const app = document.querySelector<HTMLElement>("#app")!;

// 1. ESTRUCTURA GLOBAL (Layout de tres niveles)
app.innerHTML = `
  <!-- SECCIÓN 1: CONTROLES GLOBAL -->
  <section class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
    <div>
      <h2 class="text-xl font-bold text-slate-200">System Dashboard</h2>
      <p class="text-xs text-slate-500">Configuración global y estado</p>
    </div>
    <div id="theme-buttons-container" class="flex gap-2 mt-4 sm:mt-0">
      <button data-set-theme="Dark" class="px-4 py-2 border border-white/10 rounded hover:bg-white/10 cursor-pointer text-sm transition-colors">Dark</button>
      <button data-set-theme="Light" class="px-4 py-2 border border-white/10 rounded hover:bg-white/10 cursor-pointer text-sm transition-colors">Light</button>
      <button data-set-theme="Terminal" class="px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10 cursor-pointer text-sm text-green-400 transition-colors">Terminal</button>
    </div>
  </section>

  <!-- GRID PRINCIPAL DE MÓDULOS -->
  <div class="grid grid-cols-1 gap-12">
    
    <!-- MÓDULO A: CRIPTO (Mercado) -->
    <section class="bg-slate-900/50 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
      <div class="p-6 border-b border-white/10 flex justify-between items-center bg-blue-500/5">
          <h2 class="text-2xl font-bold text-blue-400 tracking-tighter">Market Overview</h2>
          <span class="text-[10px] text-slate-500 uppercase tracking-widest font-black">Live Data Feed</span>
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

    <!-- MÓDULO B: INVENTARIO (Productos) -->
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

      <div id="product-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <div class="col-span-full py-20 text-center text-slate-600 font-mono text-sm uppercase tracking-widest animate-pulse">
          Synchronizing inventory database...
        </div>
      </div>
    </section>

    <!-- ==========================================
    NUEVO MÓDULO C: PRODUCTIVIDAD (Tablero Kanban)
    ========================================== -->
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

      <!-- Contenedor donde el renderTaskBoard inyectará las 3 columnas -->
      <div id="kanban-container">
        <div class="py-12 text-center text-slate-600 font-mono text-sm uppercase tracking-widest animate-pulse">
          Loading core operational tasks...
        </div>
      </div>
    </section>

  </div>
`;

// 2. LISTENERS
themeService.setupEventListeners("theme-buttons-container");

// 3. LÓGICA DE CARGA (ORQUESTACIÓN)

// Carga de Mercado (Cripto)
const loadMarket = async () => {
  try {
    const data = await CryptoService.getTopCoins(10);
    renderCryptoTable("crypto-table-body", data);
  } catch (error) {
    document.getElementById("crypto-table-body")!.innerHTML =
      `<tr><td colspan="3" class="p-8 text-center text-red-400">Market connection lost.</td></tr>`;
  }
};

// Carga de Inventario (Productos)
const loadInventory = async () => {
  const grid = document.getElementById("product-grid")!;
  const counter = document.getElementById("product-count")!;
  try {
    const products = await ProductService.getProducts(8);
    grid.innerHTML = products.map((p) => renderProductCard(p)).join("");
    counter.innerText = `${products.length} ITEMS READY`;
  } catch (error) {
    grid.innerHTML = `<div class="col-span-full p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center"><p class="text-rose-400 font-mono text-sm">CRITICAL ERROR: Failed to link with Inventory API</p></div>`;
  }
};

// ==========================================
// NUEVA FUNCIÓN: Carga de Kanban (Tareas)
// ==========================================
const loadKanban = async () => {
  const container = document.getElementById("kanban-container")!;
  try {
    // Invocamos nuestro servicio solicitando 12 tareas
    const tasks = await TaskStorageService.getTasks(12);

    // Inyectamos el HTML estructurado pasándole los datos limpios
    container.innerHTML = renderTaskBoard(tasks);
  } catch (error) {
    container.innerHTML = `
      <div class="p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center">
        <p class="text-rose-400 font-mono text-sm">SYSTEM FAULT: Operations board offline</p>
      </div>
    `;
  }
};

// DISPARO INICIAL EN PARALELO
loadMarket();
loadInventory();
loadKanban(); // Lanzamos la tercera API
