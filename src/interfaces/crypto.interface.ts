/**
 * DTO (Data Transfer Object) for cryptographic operations.
 * Representa la estriuctura exacta de los datos que devuelve la API de CoinGecko para las criptomonedas.
 *
 */

export interface CoinGeckoDTO {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  image: string;
  price_change_percentage_24h: number; // se refiere al cambio de precio en las últimas 24 horas
}

/**
 * Domain Model.
 * Representa la estructura de datos que se utilizará en el dominio de la aplicación, es decir, cómo se manejarán los datos dentro de la aplicación.
 */

export interface CryptoCurrency {
  id: string;
  name: string;
  symbol: string;
  price: number;
  image: string;
  change24h: number; // se refiere al cambio de precio en las últimas 24 horas
  isPositive?: boolean; // propiedad adicional para indicar si el cambio es positivo o negativo, útil para la UI
}
