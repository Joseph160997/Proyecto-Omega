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

/**
 * Valida todas las variables de entorno requeridas y reporta TODAS las faltantes en un solo error.
 * Esto evita tener que reiniciar el servidor múltiples veces para descubrir cada variable faltante.
 */
function validateAllEnvs(): void {
  const requiredVars = ["VITE_API_COINGECKO", "VITE_API_FAKESTORE", "VITE_API_TASKS"] as const;
  const missing: string[] = [];
  
  for (const name of requiredVars) {
    const value = import.meta.env[name];
    if (!value || value.trim() === "") {
      missing.push(name);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `[Omega] Faltan las siguientes variables de entorno: ${missing.join(", ")}. ` +
        `Copia .env.example a .env en la raíz del proyecto, completa todas las variables y reinicia "npm run dev".`,
    );
  }
}

// Ejecutar validación al cargar el módulo
validateAllEnvs();

/** URLs base de las APIs externas (no son claves secretas, son endpoints públicos). */
export const env = {
  apiCoingecko: requireEnv("VITE_API_COINGECKO"),
  apiFakestore: requireEnv("VITE_API_FAKESTORE"),
  apiTasks: requireEnv("VITE_API_TASKS"),
} as const;
