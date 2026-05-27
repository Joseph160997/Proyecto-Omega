import type { ThemeMode } from "../interfaces/types";
import { storage } from "./storage";

export const themeService = {
  /**
   * inicializa el tema al cargar la app.
   * busca en el storage el tema guardado, si no hay ninguno, aplica el tema "Dark" por defecto.
   */
  init(): void {
    const savedTheme = storage.get<ThemeMode>("theme") ?? "Dark";

    // Aplicamos el tema guardado o el tema por defecto
    this.apply(savedTheme);
  },
  /**
   * aplica un tema específico a la aplicación.
   * @param theme el tema a aplicar, debe ser uno de los valores definidos en ThemeMode.
   * el método `apply` se encarga de actualizar la clase del elemento raíz del documento (generalmente `<html>`) para reflejar el tema seleccionado. Además, guarda el tema seleccionado en el almacenamiento local utilizando el servicio de almacenamiento definido en `storage`.
   */
  apply(theme: ThemeMode): void {
    storage.save("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  },

  /**
   * Nueva funcion para gestionar los click de los botones de temas, desde cualquier parte.
   *
   */
  setupEventListeners(containerId: string): void {
    // verificamos que el contenedor exista
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(
        `No se encontró el contenedor con id ${containerId} para configurar los eventos de tema.`,
      );
      return;
    }

    // Delegamos el evento click al contenedor, filtrando por los botones de tema
    container.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;

      // Verificamos si el elemento clickeado tiene el atributo data-set-theme, que es el que usamos para identificar los botones de tema.
      if (!target.hasAttribute("data-set-theme")) return;
      const theme = target.dataset.setTheme as ThemeMode | undefined; // dataset

      // Si se hizo click en un botón de tema, aplicamos el tema correspondiente
      if (theme) {
        this.apply(theme); //this se refiere a themeService, por eso es importante usar una función tradicional y no una arrow function, para que el contexto de `this` sea el correcto.
      }
    });
  },
};
