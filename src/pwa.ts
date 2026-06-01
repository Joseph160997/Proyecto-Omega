// =========================================================================
// PWA: SERVICE WORKER REGISTRATION SCRIPT
// =========================================================================

// Importamos la función nativa que inyecta Vite de forma interna
// para controlar el Service Worker.
import { registerSW } from "virtual:pwa-register";

/**
 * Inicializa y activa el Service Worker en el navegador.
 * Actúa como el interruptor de encendido del modo Offline.
 */
export const initPWARegistration = (): void => {
  // 1. Verificación de seguridad: Comprobamos si el navegador del
  // usuario es moderno y soporta "serviceWorker".
  if ("serviceWorker" in navigator) {
    // 2. Encendemos el registro asíncrono
    registerSW({
      // Este evento se dispara si subes cambios al servidor y el
      // navegador detecta código nuevo.
      onNeedRefresh() {
        console.log(
          "PWA: Nueva versión detectada en el servidor. Actualizando...",
        );
      },

      // Este evento confirma que el Service Worker ya descargó el HTML,
      // CSS de Tailwind y JS en el Cache Storage.
      onOfflineReady() {
        console.log(
          "PWA: ¡Archivos listos en caché! La app ya funciona 100% Offline.",
        );
      },
    });
  } else {
    // Si el usuario usa un navegador extremadamente viejo, la app
    // seguirá funcionando pero solo si tiene internet.
    console.warn("PWA: Este navegador no soporta el modo Offline.");
  }
};
