import "./style.css";
import { themeService } from "./services/theme";
import { CryptoService } from "./services/crypto.services";
import { renderCryptoTable } from "./ui/crypto.table";
import { ProductService } from "./services/product.services";
import { renderProductCard } from "./ui/ProductCard";
import { TaskStorageService } from "./services/task.service";
import { renderTaskBoard } from "./ui/TaskBoard";

// NUEVOS IMPORTES COMPONENTIZADOS
import { renderLayout } from "./ui/Layout";
import { renderThemeSelector } from "./ui/ThemeSelector";

// 1. INICIALIZAR CONFIGURACIONES DE ENTORNO GLOBAL
themeService.init();

// 2. CAPTURAR EL NODO RAÍZ DEL DOM E INYECTAR EL LAYOUT BASE
const app = document.querySelector<HTMLElement>("#app")!;
app.innerHTML = renderLayout();

// 3. INYECTAR EL SELECTOR DE TEMAS EN SU RESPECTIVO CONTENEDOR
const themeContainer = document.getElementById("theme-buttons-container")!;
themeContainer.innerHTML = renderThemeSelector();

// 4. ACTIVAR LOS ESCUCHADORES DE EVENTOS DE NUESTROS COMPONENTES
themeService.setupEventListeners("theme-buttons-container");

// =========================================================================
// 5. ORQUESTACIÓN DE CARGA DE DATOS ASÍNCRONOS (CONEXIÓN CON APIs)
// =========================================================================

// Módulo A: Carga y Renderizado del Mercado de Criptomonedas
const loadMarket = async (): Promise<void> => {
  try {
    const data = await CryptoService.getTopCoins(10);
    renderCryptoTable("crypto-table-body", data);
  } catch (error) {
    document.getElementById("crypto-table-body")!.innerHTML =
      `<tr><td colspan="3" class="p-8 text-center text-red-400">Market connection lost.</td></tr>`;
  }
};

// Módulo B: Carga y Renderizado del Inventario de Productos
const loadInventory = async (): Promise<void> => {
  const grid = document.getElementById("product-grid")!;
  const counter = document.getElementById("product-count")!;
  try {
    const products = await ProductService.getProducts(8);
    grid.innerHTML = products.map((p) => renderProductCard(p)).join("");
    counter.innerText = `${products.length} ITEMS READY`;
  } catch (error) {
    grid.innerHTML = `
      <div class="col-span-full p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center">
        <p class="text-rose-400 font-mono text-sm">CRITICAL ERROR: Failed to link with Inventory API</p>
      </div>`;
  }
};

// Módulo C: Carga y Renderizado de Operaciones Core (Tablero Kanban)
const loadKanban = async (): Promise<void> => {
  const container = document.getElementById("kanban-container")!;
  try {
    const tasks = await TaskStorageService.getTasks(12);
    container.innerHTML = renderTaskBoard(tasks);
  } catch (error) {
    container.innerHTML = `
      <div class="p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center">
        <p class="text-rose-400 font-mono text-sm">SYSTEM FAULT: Operations board offline</p>
      </div>`;
  }
};

// DISPARO SIMULTÁNEO Y EN PARALELO DE LAS RENDICIONES DE DATOS
loadMarket();
loadInventory();
loadKanban();
