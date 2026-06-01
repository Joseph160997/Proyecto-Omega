import type {
  CoinGeckoDTO,
  CryptoCurrency,
} from "../interfaces/crypto.interface";
import { CryptoMapper } from "../mappers/crypto.mapper";
import { env } from "../config/env";
import { fetchWithCache } from "../utils/fetchWithCache";

const fetchOptions: RequestInit = {
  method: "GET",
  headers: { accept: "application/json" },
};

export const CryptoService = {
  async getTopCoins(limit: number = 10): Promise<CryptoCurrency[]> {
    const url = `${env.apiCoingecko}&per_page=${limit}`;

    return fetchWithCache<CoinGeckoDTO[], CryptoCurrency[]>(
      url,
      "omega_crypto",
      CryptoMapper.toDomainList,
      fetchOptions,
    );
  },
};
