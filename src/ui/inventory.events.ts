import type {
  InventoryFilterState,
  Product,
} from "../interfaces/product.interface";
import { sortByPrice } from "../utils/sorters";
import { renderProductCard } from "./ProductCard";

// 1. Definimos el estado inicial de nuestros filtros
let currentFilter: InventoryFilterState = {
  category: "all",
  priceOrder: "none",
};

/**
 * Aplica filtros y ordenamiento a una lista de productos según el estado actual.
 * @param products Una lista de productos que se desea filtrar y ordenar. Debe ser un array válido de objetos Product.
 * @param state El estado actual de los filtros y ordenamiento. Debe ser un objeto que cumpla con la interfaz InventoryFilterState, que incluye las propiedades 'category' y 'priceOrder'.
 * @returns Una nueva lista de productos que ha sido filtrada por categoría y ordenada por precio según el estado proporcionado. Si el estado indica que no se debe filtrar por categoría, se incluirán todos los productos. Si el estado indica que no se debe ordenar por precio, se mantendrá el orden original de los productos.
 */
export const applyFilterAndSort = (
  products: Product[],
  state: InventoryFilterState,
): Product[] => {
  let result = products;

  if (state.category !== "all") {
    result = result.filter((p) => p.category === state.category);
  }

  if (state.priceOrder !== "none") {
    result = sortByPrice(result, state.priceOrder);
  }

  return result;
};

// 3. Función Principal de Eventos (La que exportamos a main.ts)
export const setupInventorySorting = (products: Product[]): void => {
  // A. Capturamos todos los elementos del DOM que vamos a leer o modificar
  const categorySelect = document.getElementById(
    "category-filter",
  ) as HTMLSelectElement;
  const priceSelect = document.getElementById(
    "price-sort",
  ) as HTMLSelectElement;
  const grid = document.getElementById("product-grid");
  const countElement = document.getElementById("product-count"); // Capturamos el contador

  // B. Cláusula de guarda: Si falta algún elemento en el HTML, abortamos para evitar errores
  if (!categorySelect || !priceSelect || !grid || !countElement) return;

  // C. Función centralizada de renderizado (Sincroniza toda la UI)
  const updateGrid = () => {
    // Paso 1: Procesamos los datos con el estado actual
    const filteredProducts = applyFilterAndSort(products, currentFilter);

    // Paso 2: Actualizamos la cuadrícula de tarjetas
    grid.innerHTML = filteredProducts.map(renderProductCard).join("");

    // Paso 3: Actualizamos el texto del contador dinámicamente
    // Usamos padStart para que siempre tenga 2 dígitos (ej: "08" en vez de "8"), manteniendo la estética técnica
    const count = filteredProducts.length.toString().padStart(2, "0");
    countElement.textContent = `${count} ITEMS SCANNING`;
  };

  // D. Manejadores de eventos individuales
  const handleCategoryChange = (): void => {
    currentFilter.category =
      categorySelect.value as InventoryFilterState["category"];
    updateGrid(); // Llamamos al sincronizador
  };

  const handlePriceChange = (): void => {
    currentFilter.priceOrder =
      priceSelect.value as InventoryFilterState["priceOrder"];
    updateGrid(); // Llamamos al sincronizador
  };

  // E. Escuchadores de eventos físicos
  categorySelect.addEventListener("change", handleCategoryChange);
  priceSelect.addEventListener("change", handlePriceChange);
};
