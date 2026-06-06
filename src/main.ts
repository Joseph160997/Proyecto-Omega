import "./style.css";
import { themeService } from "./services/theme";
import { CryptoService } from "./services/crypto.services";
import { renderCryptoTable } from "./ui/crypto.table";
import { ProductService } from "./services/product.services";
import { renderProductCard } from "./ui/ProductCard";
import { TaskService } from "./services/task.service";
import { renderTaskBoard } from "./ui/TaskBoard";
import { ToastService } from "./ui/Toast";
import { initPWARegistration } from "./pwa";
import { renderLayout } from "./ui/Layout";
import { renderThemeSelector } from "./ui/ThemeSelector";
import {
  renderInventoryView,
  renderKanbanView,
  renderMarketView,
} from "./ui/views";
import { setupMarketSearch } from "./ui/market.events";
import { setupInventorySorting } from "./ui/inventory.events";

const loadMarket = async (): Promise<void> => {
  const view = document.getElementById("content-view")!;
  view.innerHTML = renderMarketView();
  try {
    const allCoins = await CryptoService.getTopCoins(25);
    renderCryptoTable("crypto-table-body", allCoins);
    setupMarketSearch(allCoins);
  } catch (error) {
    console.error("[Omega] Market:", error);
    document.getElementById("crypto-table-body")!.innerHTML =
      `<tr><td colspan="3" class="p-8 text-center text-red-400">Market connection lost.</td></tr>`;
    ToastService.show("Fallo en la conexión con el mercado.", 5000);
  }
};

const loadInventory = async (): Promise<void> => {
  const view = document.getElementById("content-view")!;
  view.innerHTML = renderInventoryView();

  const grid = document.getElementById("product-grid")!;
  const counter = document.getElementById("product-count")!;
  try {
    const products = await ProductService.getProducts(25);
    setupInventorySorting(products);
    grid.innerHTML = products.map((p) => renderProductCard(p)).join("");
    counter.innerText = `${products.length} ITEMS READY`;
  } catch (error) {
    console.error("[Omega] Inventory:", error);
    grid.innerHTML = `
      <div class="col-span-full p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center">
        <p class="text-rose-400 font-mono text-sm">CRITICAL ERROR: Failed to link with Inventory API</p>
      </div>`;
    ToastService.show("Imposible sincronizar con la base de datos.", 5000);
  }
};

const loadKanban = async (): Promise<void> => {
  const view = document.getElementById("content-view")!;
  view.innerHTML = renderKanbanView();

  const container = document.getElementById("kanban-container")!;
  try {
    const tasks = await TaskService.getTasks(12);
    container.innerHTML = renderTaskBoard(tasks);
  } catch (error) {
    console.error("[Omega] Kanban:", error);
    container.innerHTML = `
      <div class="p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center">
        <p class="text-rose-400 font-mono text-sm">SYSTEM FAULT: Operations board offline</p>
      </div>`;
    ToastService.show("Servicio de operaciones desactivado.", 5000);
  }
};

const updateActiveTab = (clickedTab: HTMLElement): void => {
  const allTabs = document.querySelectorAll("#main-nav li");
  const activeClasses = [
    "text-blue-400",
    "font-bold",
    "border-b-2",
    "border-blue-400",
  ];
  const inactiveClass = "text-slate-400";

  allTabs.forEach((tab) => {
    tab.classList.remove(...activeClasses);
    tab.classList.add(inactiveClass);
  });

  clickedTab.classList.remove(inactiveClass);
  clickedTab.classList.add(...activeClasses);
};

const setupNavigation = (): void => {
  const navs = document.getElementById("main-nav")!;

  navs.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (!target.hasAttribute("data-page")) return;

    const page = target.dataset.page as string;
    updateActiveTab(target);

    if (page === "market") loadMarket();
    else if (page === "inventory") loadInventory();
    else if (page === "kanban") loadKanban();
  });
};

const renderBootError = (error: unknown): string => {
  const message =
    error instanceof Error ? error.message : "Error desconocido al iniciar.";

  return `
    <div class="flex items-center justify-center min-h-screen p-6">
      <div class="max-w-lg w-full border border-rose-500/30 bg-rose-500/5 rounded-xl p-8 text-center">
        <h1 class="text-xl font-bold text-rose-400 mb-4">Error de configuración</h1>
        <p class="text-slate-300 text-sm mb-6 font-mono">${message}</p>
        <p class="text-slate-500 text-xs">
          Consulta <code class="text-slate-400">docs/FIXES.md</code> para más detalles.
        </p>
      </div>
    </div>
  `;
};

async function bootstrap(): Promise<void> {
  try {
    initPWARegistration();
    await themeService.init();

    const app = document.querySelector<HTMLElement>("#app")!;
    app.innerHTML = renderLayout();

    const themeContainer = document.getElementById("theme-buttons-container")!;
    themeContainer.innerHTML = renderThemeSelector();
    themeService.setupEventListeners("theme-buttons-container");

    setupNavigation();

    const marketTab = document.querySelector<HTMLElement>(
      '#main-nav li[data-page="market"]',
    )!;
    updateActiveTab(marketTab);

    await loadMarket();
    console.log("Bootcamp: ¡Aplicación inicializada con éxito!");
  } catch (error) {
    console.error("Error crítico durante el arranque de la aplicación:", error);
    const app = document.querySelector<HTMLElement>("#app");
    if (app) app.innerHTML = renderBootError(error);
  }
}

bootstrap();
