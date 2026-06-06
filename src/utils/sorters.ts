import type { Product } from "../interfaces/product.interface";

/**
 * Ordena productos por precio de menor a mayor.
 */
export const sortByPrice = (products: Product[]): Product[] => {
  // .sort() es mutante (cambia el original), por eso hacemos [...products]
  // para crear una copia antes de ordenar y mantener la inmutabilidad.
  return [...products].sort((a, b) => a.price - b.price);
};
