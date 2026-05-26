import type { ProductDTO, Product } from "../interfaces/product.interface";
import { ProductMapper } from "../mappers/product.mapper";

const API_KEY = import.meta.env.VITE_API_FAKESTORE;
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

/**
 * Obtiene la lista de productos desde la API de Fake Store, mapeando los datos recibidos a objetos de tipo Product utilizando el ProductMapper.
 * @returns Un array de objetos de tipo Product con los datos de los productos obtenidos desde la API.
 * @throws Un error si la solicitud a la API falla o si ocurre un error durante el proceso de mapeo.
 */
export const ProductService = {
  async getProducts(limit: number = 20): Promise<Product[]> {
    const url = `${API_KEY}?limit=${limit}`;

    // Realizamos la solicitud a la API de Fake Store para obtener los productos
    try {
      const response = await fetch(url, options);

      // Verificamos si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(
          `Error fetching data from Fake Store API: ${response.statusText}`,
        );
      }

      // Parseamos la respuesta JSON a un array de objetos de tipo ProductDTO
      const data = (await response.json()) as ProductDTO[];

      // Mapeamos el array de ProductDTO a un array de Product utilizando el ProductMapper
      const products = ProductMapper.toDomainList(data);
      return products;

      // Manejamos cualquier error que pueda ocurrir durante la solicitud o el mapeo
    } catch (error) {
      console.error(`Error fetching data from Fake Store API: ${error}`);
      throw error; // Re-lanzamos el error para que pueda ser manejado por la capa superior (UI)
    }
  },
};
