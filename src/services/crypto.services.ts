import type {
  CoinGeckoDTO,
  CryptoCurrency,
  ICryptoKeyPair,
  ICryptoAlgorithm,
} from "../interfaces/crypto.interface";
import { CryptoMapper } from "../mappers/crypto.mapper";
import { env } from "../config/env";
import { fetchWithCache } from "../utils/fetchWithCache";

const fetchOptions: RequestInit = {
  method: "GET",
  headers: { accept: "application/json" },
};

/**
 * Servicio para operaciones criptográficas básicas
 */
export class CryptoService {
  /**
   * Genera una clave simétrica aleatoria para AES-GCM
   */
  static async generateSymmetricKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true, // puede ser exportada
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Crea una clave simétrica desde una contraseña
   */
  static async keyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Cifra un texto plano usando una clave simétrica
   */
  static async encrypt(plaintext: string, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV recomendado para AES-GCM
    
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoder.encode(plaintext)
    );

    return { ciphertext, iv };
  }

  /**
   * Descifra un texto cifrado usando una clave simétrica
   */
  static async decrypt(ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<string> {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Convierte un ArrayBuffer a una cadena hexadecimal
   */
  static arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Convierte una cadena hexadecimal a ArrayBuffer
   */
  static hexToArrayBuffer(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(Math.ceil(hex.length / 2));
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes.buffer;
  }

  /**
   * Exporta una clave criptográfica en formato RAW
   */
  static async exportKey(key: CryptoKey): Promise<ArrayBuffer> {
    return await window.crypto.subtle.exportKey('raw', key);
  }

  /**
   * Importa una clave criptográfica desde raw data
   */
  static async importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

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
