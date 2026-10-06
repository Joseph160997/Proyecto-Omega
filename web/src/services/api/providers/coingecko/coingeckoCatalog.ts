/**
 * assetId canónico → id de CoinGecko. Es una tabla propia (no el `symbol` de la API)
 * porque los símbolos de CoinGecko no son únicos. Es un Map y no un objeto para que
 * ids como "constructor" o "__proto__" no encuentren nada por herencia.
 *
 * Cada id debe coincidir exactamente con el de CoinGecko. Uno mal escrito no falla
 * aquí: la API no lo devuelve y llega a la UI como UNSUPPORTED_ASSET.
 */
export const COINGECKO_IDS: ReadonlyMap<string, string> = new Map([
  ['crypto:btc', 'bitcoin'],
  ['crypto:eth', 'ethereum'],
  ['crypto:sol', 'solana'],
  ['crypto:xrp', 'ripple'],
  ['crypto:bnb', 'binancecoin'],
  ['crypto:doge', 'dogecoin'],
  ['crypto:ada', 'cardano'],
  ['crypto:avax', 'avalanche-2'],
  ['crypto:link', 'chainlink'],
  ['crypto:dot', 'polkadot'],
  ['crypto:ltc', 'litecoin'],
  ['crypto:trx', 'tron'],
])
