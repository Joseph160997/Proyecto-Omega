import "./style.css";
import { themeService } from "./services/theme";
import { CryptoService } from "./services/crypto.services";
import { renderCryptoTable } from "./ui/crypto.table";
import { ProductService } from "./services/product.services";
import { renderProductCard } from "./ui/ProductCard";
import { TaskStorageService } from "./services/task.service";
import { renderTaskBoard } from "./ui/TaskBoard";
import { ToastService } from "./ui/Toast";

// NUEVOS IMPORTES COMPONENTIZADOS
import { renderLayout } from "./ui/Layout";
import { renderThemeSelector } from "./ui/ThemeSelector";
import {
  renderInventoryView,
  renderKanbanView,
  renderMarketView,
} from "./ui/views";

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
  const view = document.getElementById("content-view")!;
  view.innerHTML = renderMarketView();
  try {
    const data = await CryptoService.getTopCoins(10);
    renderCryptoTable("crypto-table-body", data);
  } catch (error) {
    document.getElementById("crypto-table-body")!.innerHTML =
      `<tr><td colspan="3" class="p-8 text-center text-red-400">Market connection lost.</td></tr>`;

    ToastService.show("Fallo en la conexión con el mercado.", 5000);
  }
};

// Módulo B: Carga y Renderizado del Inventario de Productos
const loadInventory = async (): Promise<void> => {
  const view = document.getElementById("content-view")!;
  view.innerHTML = renderInventoryView();

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

    ToastService.show("Imposible sincronizar con la base de datos.", 5000);
  }
};

// Módulo C: Carga y Renderizado de Operaciones Core (Tablero Kanban)
const loadKanban = async (): Promise<void> => {
  const view = document.getElementById("content-view")!;
  view.innerHTML = renderKanbanView();

  const container = document.getElementById("kanban-container")!;
  try {
    const tasks = await TaskStorageService.getTasks(12);
    container.innerHTML = renderTaskBoard(tasks);
  } catch (error) {
    container.innerHTML = `
      <div class="p-12 border border-rose-500/20 bg-rose-500/5 rounded-xl text-center">
        <p class="text-rose-400 font-mono text-sm">SYSTEM FAULT: Operations board offline</p>
      </div>`;

    ToastService.show("Servicio de operaciones desactivado.", 5000);
  }
};

/**
 * Función encargada de gestionar el estado visual (CSS)
 * de los botones de navegación.
 * @param clickedTab El elemento <li> que el usuario presionó.
 */
const updateActiveTab = (clickedTab: HTMLElement): void => {
  // 1. Capturamos todos los elementos <li> dentro del nav.
  const allTabs = document.querySelectorAll("#main-nav li");

  // 2. Definimos nuestras clases de Tailwind
  // para el estado ENCENDIDO (Activo) en un array.
  const activeClasses = [
    "text-blue-400", // Color de texto azul brillante
    "font-bold", // Letra más gruesa
    "border-b-2", // Borde inferior de 2 píxeles
    "border-blue-400", // El color del borde inferior
  ];

  // 3. Definimos la clase para el estado APAGADO (Inactivo).
  const inactiveClass = "text-slate-400";

  // 4. FASE DE LIMPIEZA (Reset):
  // Recorremos todos los botones con un forEach.
  allTabs.forEach((tab) => {
    // El operador spread (...) expande el array
    // para borrar cada clase individualmente.
    tab.classList.remove(...activeClasses);

    // Le aplicamos el color gris apagado a todos.
    tab.classList.add(inactiveClass);
  });

  // 5. FASE DE APLICACIÓN (Set):
  // Al botón específico que el usuario clickeó,
  // primero le quitamos el gris apagado...
  clickedTab.classList.remove(inactiveClass);

  // ...y luego le inyectamos todas las clases brillantes.
  clickedTab.classList.add(...activeClasses);
};

/**
 * Función encargada de gestionar el enrutamiento de la app.
 * @param page El nombre de la página solicitada.
 * @returns void
 */
// Capturamos el contenedor principal del menú
const navs = document.getElementById("main-nav")!;

// Activamos el listener global (Delegación de eventos)
navs.addEventListener("click", (event) => {
  // Casteamos el objetivo a HTMLElement
  const target = event.target as HTMLElement;

  // Guard Clause: Si lo que se clickeó no tiene
  // el atributo data-page (ej. clickeó un espacio vacío),
  // detenemos la ejecución de inmediato.
  if (!target.hasAttribute("data-page")) return;

  // Extraemos el valor de la página solicitada
  const page = target.dataset.page as string;

  // ¡MAGIA! Llamamos a nuestra función separada
  // para que pinte el botón presionado.
  updateActiveTab(target);

  // El enrutador redirige a la vista solicitada
  if (page === "market") {
    loadMarket();
  } else if (page === "inventory") {
    loadInventory();
  } else if (page === "kanban") {
    loadKanban();
  }
});

// DISPARO SIMULTÁNEO Y EN PARALELO DE LAS RENDICIONES DE DATOS
loadMarket();
