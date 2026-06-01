import type { ProductDTO, Product } from "../interfaces/product.interface";
import { ProductMapper } from "../mappers/product.mapper";
import { env } from "../config/env";
import { fetchWithCache } from "../utils/fetchWithCache";

const fetchOptions: RequestInit = {
  method: "GET",
  headers: { accept: "application/json" },
};

export const ProductService = {
  async getProducts(limit: number = 20): Promise<Product[]> {
    const url = `${env.apiFakestore}?limit=${limit}`;

    return fetchWithCache<ProductDTO[], Product[]>(
      url,
      "omega_products",
      ProductMapper.toDomainList,
      fetchOptions,
    );
  },
};
