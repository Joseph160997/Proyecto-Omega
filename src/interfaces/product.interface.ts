/**
 * Lo que devuelve la api de productos (DTO - Data Transfer Object).
 * Representa la estructura exacta de los datos que devuelve la API de Fake Store para los productos.
 *
 * Lo que manejamos dentro del dominio de la aplicación (Domain Model).
 * Representa la estructura de datos que se utilizará en el dominio de la aplicación, es decir, cómo se manejarán los datos dentro de la aplicación.
 */
export interface ProductDTO {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating: number; // <=== es un objeto que contiene "rate" y "count", pero para simplificarlo lo dejamos como un número que representa la calificación promedio del producto
  stock: number; // <=== "OJO" este campo no existe en la API, lo agregamos para simular el stock de productos
}
