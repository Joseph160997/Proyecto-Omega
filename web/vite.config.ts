import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

import { SITE_URL } from './src/seo/site.ts'
import { seoPlugin } from './vite-plugin-seo.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), seoPlugin(SITE_URL)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // Por defecto los tests corren en Node. Los de componentes pueden pedir jsdom por archivo.
    environment: 'node',
    setupFiles: ['./src/test-setup.ts'],
  },
})
