import type { Product } from "../interfaces/product.interface";
import { sortByPrice } from "../utils/sorters";
import { renderProductCard } from "./ProductCard";

export const setupInventorySorting = (products: Product[]) => {
  const sortButton = document.getElementById(
    "sort-price-btn",
  ) as HTMLButtonElement;
  if (!sortButton) return;

  sortButton.addEventListener("click", () => {
    const sortedProducts = sortByPrice(products);
    // Actualizamos el DOM con los productos ordenados por precio.
    const grid = document.getElementById("product-grid")!;
    grid.innerHTML = sortedProducts.map((p) => renderProductCard(p)).join("");
  });
};
