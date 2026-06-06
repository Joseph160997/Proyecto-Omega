// src/utils/sorters.ts
import type { Product } from "../interfaces/product.interface";
import type { SortOrder } from "../interfaces/product.interface";

/**
 * Ordena productos por precio según el orden especificado.
 * @param products  Una lista de productos que se desea ordenar. Debe ser un array válido de objetos Product.
 * @param order  El orden de clasificación deseado. Puede ser "asc" para ascendente, "desc" para descendente o "none" para no ordenar.
 * @returns Una nueva lista de productos ordenada por precio según el orden especificado. Si el orden es "none", devuelve la lista original sin modificar.
 * @throws Si el parámetro 'products' no es un array válido, la función lanzará un error.
 */
export const sortByPrice = (
  products: Product[],
  order: SortOrder,
): Product[] => {
  if (order === "none") return products;

  return [...products].sort((a, b) => {
    if (order === "asc") return a.price - b.price;
    return b.price - a.price; // Descendente: de mayor a menor
  });
};
