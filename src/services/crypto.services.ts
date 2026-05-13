import type {
  CoinGeckoDTO,
  CryptoCurrency,
} from "../interfaces/crypto.interface";
import { CryptoMapper } from "../mappers/crypto.mapper";

const API_URL =
  "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    // Authorization: `Bearer ${API_KEY}`,
  },
};

/**
 * Obtiene las top 10 criptomonedas por capitalización de mercado desde la API de CoinGecko, mapeando los datos recibidos a objetos de tipo CryptoCurrency utilizando el CryptoMapper.
 * @returns Un array de objetos de tipo CryptoCurrency con los datos de las criptomonedas obtenidos desde la API.
 * @throws Un error si la solicitud a la API falla o si ocurre un error durante el proceso de mapeo.
 */

export const CryptoService = {
  async getTopCoins(limit: number = 10): Promise<CryptoCurrency[]> {
    const url = `${API_URL}&per_page=${limit}`;

    // Realizamos la solicitud a la API de CoinGecko para obtener las criptomonedas
    try {
      const response = await fetch(url, options);

      // Verificamos si la respuesta es exitosa
      if (!response.ok) {
        throw new Error(
          `Error fetching data from CoinGecko API: ${response.statusText}`,
        );
      }
      // Parseamos la respuesta JSON a un array de objetos de tipo CoinGeckoDTO
      const data = (await response.json()) as CoinGeckoDTO[];

      // Mapeamos el array de CoinGeckoDTO a un array de CryptoCurrency utilizando el CryptoMapper
      const crypto = CryptoMapper.toDomainList(data);
      return crypto;

      // Manejamos cualquier error que pueda ocurrir durante la solicitud o el mapeo
    } catch (error) {
      console.error(`Error fetching data from CoinGecko API: ${error}`);
      return [];
    }
  },
};
