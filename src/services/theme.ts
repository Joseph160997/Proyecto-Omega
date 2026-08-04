import type { ThemeMode } from "../interfaces/types";
import { storage } from "./storage";

export const themeService = {
  /**
   * Inicializa el tema al cargar la app de forma asíncrona.
   * Busca en IndexedDB el tema guardado. Si no hay ninguno, aplica "Dark".
   */
  async init(): Promise<void> {
    // 1. Ponemos el 'await' para pausar la ejecución hasta que IndexedDB responda.
    const savedTheme = (await storage.get<ThemeMode>("theme")) ?? "DeepSpace";

    // 2. Aplicamos el tema recuperado.
    // Como apply ahora es async, usamos await para asegurar el guardado.
    await this.apply(savedTheme);
  },

  /**
   * Aplica un tema específico a la aplicación y lo persiste.
   * @param theme El tema a aplicar (ThemeMode).
   */
  async apply(theme: ThemeMode): Promise<void> {
    // 1. Guardamos de forma asíncrona en IndexedDB.
    // Esperamos a que la transacción termine en el disco duro.
    await storage.save("theme", theme);

    // 2. Modificamos el DOM. Esto sigue siendo síncrono e instantáneo.
    document.documentElement.setAttribute("data-theme", theme);
  },

  /**
   * Gestiona los clicks de los botones de temas mediante delegación de eventos.
   */
  setupEventListeners(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(
        `No se encontró el contenedor con id ${containerId} para configurar los eventos de tema.`,
      );
      return;
    }

    // El callback del evento puede ser síncrono, pero por dentro manejamos la promesa.
    container.addEventListener("click", async (event) => {
      const target = event.target as HTMLElement;

      if (!target.hasAttribute("data-set-theme")) return;

      const theme = target.dataset.setTheme as ThemeMode | undefined;

      if (theme) {
        // Ejecutamos el método apply con await porque ahora es una operación asíncrona.
        await this.apply(theme);
      }
    });
  },
};
