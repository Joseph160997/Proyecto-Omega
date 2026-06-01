import { defineConfig } from "vite";

// 1. Plugin de Tailwind (Asumo que usas la v4 que es el estándar actual)
import tailwindcss from "@tailwindcss/vite";

// 2. Plugin de PWA
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    // Mantenemos tu motor de estilos de Tailwind activo
    tailwindcss(),

    // Configuramos el motor de la PWA con su Manifiesto
    VitePWA({
      registerType: "autoUpdate",

      // Configuración del Service Worker (Cache de archivos)
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },

      // EL MANIFIESTO: El "Documento de Identidad" de tu App
      // Esto es lo que permite que se instale en el móvil/PC.
      manifest: {
        name: "Omega Dashboard Pro",
        short_name: "OmegaDB",
        description: "App financiera con modo offline",
        theme_color: "#1e293b", // Color de la barra de la app
        background_color: "#0f172a", // Color al abrir la app
        display: "standalone", // Se abre sin barras de navegador
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});
