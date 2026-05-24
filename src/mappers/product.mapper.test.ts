import { describe, it, expect, vi, afterEach } from "vitest";
import { ProductMapper } from "./product.mapper";
import type { ProductDTO } from "../interfaces/product.interface";

// "describe" agrupa un conjunto de pruebas relacionadas. Aquí agrupamos todo lo del Mapper.
describe("ProductMapper", () => {
  // Limpiamos los mocks después de cada test para no contaminar otras pruebas
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Agrupamos las pruebas específicas del método toDomain
  describe("toDomain", () => {
    // "it" describe lo que DEBERÍA pasar.
    // TRADUCCIÓN: "debería mapear correctamente un ProductDTO a un modelo de dominio Product con stock controlado"
    it("should correctly map a ProductDTO to a Product domain model with controlled stock", () => {
      // ==========================================
      // 1. ARRANGE (PREPARAR)
      // Aquí configuramos todo el escenario, los datos falsos y los espías necesarios.
      // ==========================================
      const mockDto: ProductDTO = {
        id: 1,
        title: "Test Product",
        price: 29.99,
        description: "A great description",
        category: "electronics",
        image: "https://via.placeholder.com/150",
        rating: { rate: 4.5, count: 120 },
      };

      // Interceptamos Math.random para que deje de ser aleatorio y devuelva 0.5.
      // Matemáticamente: Math.floor(0.5 * 100) + 1 = 51
      const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

      // ==========================================
      // 2. ACT (EJECUTAR)
      // Aquí llamamos a la función real que queremos probar, pasándole lo que preparamos.
      // ==========================================
      const result = ProductMapper.toDomain(mockDto);

      // ==========================================
      // 3. ASSERT (COMPROBAR/AFIRMAR)
      // Aquí verificamos que el resultado de la ejecución sea exactamente el esperado.
      // ==========================================
      expect(mathRandomSpy).toHaveBeenCalledTimes(1); // Afirmamos que el espía fue usado
      expect(result).toEqual({
        id: 1,
        title: "Test Product",
        price: 29.99,
        description: "A great description",
        category: "electronics",
        image: "https://via.placeholder.com/150",
        rating: 4.5,
        stock: 51, // Validamos el resultado de nuestro Arrange
      });
    });

    // TRADUCCIÓN: "debería manejar campos opcionales faltantes o un objeto rating corrupto de forma segura"
    it("should handle missing optional fields or corrupt rating object safely", () => {
      // Simulamos que la API falló y no envió el objeto rating
      const corruptDto: ProductDTO = {
        id: 2,
        title: "Corrupted Product",
        price: 19.99,
        description: "A corrupted description",
        category: "electronics",
        image: "https://via.placeholder.com/150",
        rating: undefined,
      } as unknown as ProductDTO; // type assertion para saltarnos el error de TS en el test

      const result = ProductMapper.toDomain(corruptDto);

      // Comprobamos que nuestra programación defensiva asigne un 0 en lugar de explotar
      expect(result.rating).toBe(0);
    });

    // TRADUCCIÓN: "debería crear un objeto profundamente nuevo y no mantener referencias al objeto original"
    it("should create a deeply new object and not hold references to the original object", () => {
      // Comprobamos la inmutabilidad (evitar que el mapper modifique referencias de memoria)
      const mockDto: ProductDTO = {
        id: 1,
        title: "Test Product",
        price: 29.99,
        description: "A great description",
        category: "electronics",
        image: "https://via.placeholder.com/150",
        rating: { rate: 4.5, count: 120 },
      };

      const result = ProductMapper.toDomain(mockDto);

      // Mutamos el DTO original a propósito
      mockDto.title = "Modified Title";
      mockDto.price = 39.99;

      // El resultado debe mantenerse intacto con los valores originales
      expect(result.title).toBe("Test Product");
      expect(result.price).toBe(29.99);
    });
  });

  // Agrupamos las pruebas específicas del método toDomainList
  describe("toDomainList", () => {
    // TRADUCCIÓN: "debería mapear un array de DTOs manteniendo el stock bajo control"
    it("should map an array of DTOs maintaining stock under control", () => {
      const mockDtoList: ProductDTO[] = [
        {
          id: 1,
          title: "Product 1",
          price: 10,
          description: "Desc 1",
          category: "cat 1",
          image: "img 1",
          rating: { rate: 4.0, count: 10 },
        },
      ];

      // Forzamos el límite superior del random (0.9999) para que el stock sea 100
      vi.spyOn(Math, "random").mockReturnValue(0.9999);

      const resultList = ProductMapper.toDomainList(mockDtoList);

      expect(resultList[0].stock).toBe(100);
    });

    // TRADUCCIÓN: "debería manejar un array vacío sin errores"
    it("should handle an empty array without errors", () => {
      const resultList = ProductMapper.toDomainList([]);
      expect(resultList).toEqual([]);
    });

    // TRADUCCIÓN: "debería devolver un array vacío cuando se llama con una entrada que no es un array"
    it("should return an empty array when called with a non-array input", () => {
      // Verificamos que nuestro Array.isArray(dtoList) del código de producción funcione
      const result = ProductMapper.toDomainList(
        null as unknown as ProductDTO[],
      );
      expect(result).toEqual([]);
    });
  });
});
