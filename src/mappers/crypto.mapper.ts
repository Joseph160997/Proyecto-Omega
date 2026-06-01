import type {
  CryptoCurrency,
  CoinGeckoDTO,
} from "../interfaces/crypto.interface";

/**
 * Mapeador para convertir entre objetos DTO y modelos de dominio para criptomonedas.
 *
 */
export class CryptoMapper {
  /**
   * Convierte un objeto de tipo CoinGeckoDTO a un objeto de tipo CryptoCurrency.
   * @param dto El objeto de tipo CoinGeckoDTO que se desea convertir.
   * @returns Un objeto de tipo CryptoCurrency con los datos mapeados desde el DTO.
   */
  static toDomain(dto: CoinGeckoDTO): CryptoCurrency {
    return {
      id: dto.id,
      name: dto.name,
      symbol: dto.symbol.toUpperCase(), // Convertimos el símbolo a mayúsculas para mantener consistencia
      price: dto.current_price,
      image: dto.image,
      change24h: dto.price_change_percentage_24h,
      isPositive: dto.price_change_percentage_24h > 0, // Indicamos si el cambio es positivo o negativo para facilitar la lógica en la UI
    };
  }

  /**
   * mapea un array de monedas en formato CoinGeckoDTO a un array de monedas en formato CryptoCurrency.
   * @param dtos Un array de objetos de tipo CoinGeckoDTO que se desean convertir.
   * @returns Un array de objetos de tipo CryptoCurrency con los datos mapeados desde los DTOs.
   */
  static toDomainList(dtoList: CoinGeckoDTO[]): CryptoCurrency[] {
    if (!Array.isArray(dtoList)) return []; // Validación para asegurarnos de que el input es un array
    return dtoList.map((dto) => CryptoMapper.toDomain(dto));
  }
}
