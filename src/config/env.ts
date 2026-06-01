/**
 * Valida que una variable de entorno de Vite exista y no esté vacía.
 * Si falta, lanza un error con instrucciones claras para el desarrollador.
 */
function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];

  if (!value || value.trim() === "") {
    throw new Error(
      `[Omega] Falta la variable "${name}". ` +
        `Copia .env.example a .env en la raíz del proyecto y reinicia "npm run dev".`,
    );
  }

  return value;
}

/** URLs base de las APIs externas (no son claves secretas, son endpoints públicos). */
export const env = {
  apiCoingecko: requireEnv("VITE_API_COINGECKO"),
  apiFakestore: requireEnv("VITE_API_FAKESTORE"),
  apiTasks: requireEnv("VITE_API_TASKS"),
} as const;
