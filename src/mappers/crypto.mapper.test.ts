// src/mappers/crypto.mapper.test.ts
import { describe, it, expect } from "vitest";
import { CryptoMapper } from "./crypto.mapper";
import type { CoinGeckoDTO } from "../interfaces/crypto.interface";

describe("CryptoMapper Test Suite", () => {
  it("should mark isPositive as true when 24h change is greater than zero", () => {
    // ARRANGE (Preparación) - Configuramos el escenario de prueba con un DTO de ejemplo
    // SCENARIO 1: Positive Market
    const mockDTO: CoinGeckoDTO = {
      id: "bitcoin",
      symbol: "btc", // <-- Símbolo en minúsculas para probar la conversión a mayúsculas en el mapper
      name: "Bitcoin",
      current_price: 65000,
      image: "https://url.com/btc.png",
      price_change_percentage_24h: 5.4,
    };

    // ACT (Ejecución) - Llamamos al método que queremos probar
    const result = CryptoMapper.toDomain(mockDTO);

    // ASSERT (Afirmación) - Verificamos que el resultado sea el esperado
    expect(result.symbol).toBe("BTC"); // Verificamos que el símbolo se haya convertido a mayúsculas
    expect(result.isPositive).toBe(true); // Verificamos que isPositive sea true para un cambio positivo
    expect(result.change24h).toBe(5.4); // Verificamos que el cambio de precio en 24h se haya mapeado correctamente
  });

  it("should mark isPositive as false when 24h change is less than zero", () => {
    // SCENARIO 2: Negative Market
    const mockDTO: CoinGeckoDTO = {
      id: "ethereum",
      symbol: "eth",
      name: "Ethereum",
      current_price: 4000,
      image: "https://url.com/eth.png",
      price_change_percentage_24h: -5.4, // <-- Cambio negativo para este escenario
    };

    const result = CryptoMapper.toDomain(mockDTO);

    expect(result.symbol).toBe("ETH");
    expect(result.isPositive).toBe(false);
    expect(result.change24h).toBe(-5.4);
  });

  it("should mark isPositive as false when 24h change is exactly zero", () => {
    // SCENARIO 3: Flat Market (Edge Case)
    const mockDTO: CoinGeckoDTO = {
      id: "ripple",
      symbol: "xrp",
      name: "Ripple",
      current_price: 1,
      image: "https://url.com/xrp.png",
      price_change_percentage_24h: 0, // <-- Cambio exactamente cero para este escenario
    };

    const result = CryptoMapper.toDomain(mockDTO);

    expect(result.symbol).toBe("XRP");
    expect(result.isPositive).toBe(false);
    expect(result.change24h).toBe(0);
  });

  it("should return an empty array when toDomainList is called with a non-array input", () => {
    // SCENARIO 4: Invalid Input for toDomainList
    const result = CryptoMapper.toDomainList(null as unknown as CoinGeckoDTO[]); // Pasamos un valor no array para probar la validación

    expect(result).toEqual([]); // Verificamos que el resultado sea un array vacío
  });

  it("should return an empty array when toDomainList is called with an empty array input", () => {
    const result = CryptoMapper.toDomainList([]);
    expect(result).toEqual([]);
  });

  it("should work when toDomainList is passed as a detached callback (fetchWithCache pattern)", () => {
    const mockDTO: CoinGeckoDTO = {
      id: "bitcoin",
      symbol: "btc",
      name: "Bitcoin",
      current_price: 65000,
      image: "https://url.com/btc.png",
      price_change_percentage_24h: 5.4,
    };

    const mapperFn = CryptoMapper.toDomainList;
    const result = mapperFn([mockDTO]);

    expect(result).toHaveLength(1);
    expect(result[0].symbol).toBe("BTC");
  });
});
