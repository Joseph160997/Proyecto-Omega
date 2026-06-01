/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_API_COINGECKO: string;
  readonly VITE_API_FAKESTORE: string;
  readonly VITE_API_TASKS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
