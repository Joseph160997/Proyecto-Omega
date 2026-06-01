import type { ProductDTO, Product } from "../interfaces/product.interface";

/**
 * Mapper para convertir entre objetos DTO y modelos de dominio para productos.
 */

export class ProductMapper {
  /**
   * Convierte un objeto de tipo ProductDTO a un objeto de tipo Product.
   * @param dto El objeto de tipo ProductDTO que se desea convertir.
   * @returns Un objeto de tipo Product con los datos mapeados desde el DTO.
   */
  static toDomain(dto: ProductDTO): Product {
    return {
      id: dto.id,
      title: dto.title,
      price: dto.price,
      description: dto.description,
      category: dto.category,
      image: dto.image,
      rating: dto.rating?.rate ?? 0, // <=== aquí estamos tomando solo el valor de "rate" para simplificar la calificación del producto
      stock: Math.floor(Math.random() * 100) + 1, // <=== generamos un número aleatorio entre 1 y 100 para simular el stock de productos
    };
  }

  /**
   * Mapea un array de productos en formato ProductDTO a un array de productos en formato Product.
   * @param dtos Un array de objetos de tipo ProductDTO que se desean convertir.
   * @returns Un array de objetos de tipo Product con los datos mapeados desde los DTOs.
   */
  static toDomainList(dtoList: ProductDTO[]): Product[] {
    if (!Array.isArray(dtoList)) return []; // Validación para asegurarnos de que el input es un array
    return dtoList.map((dto) => ProductMapper.toDomain(dto));
  }
}
