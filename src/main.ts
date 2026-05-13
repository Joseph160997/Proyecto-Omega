import "./style.css";
import { themeService } from "./services/theme";

// 1. Iniciamos el tema (esto aplica lo que haya en localStorage)
themeService.init();

const app = document.querySelector<HTMLElement>("#app")!;

// 2. Inyectamos el HTML
app.innerHTML = `
  <div id="theme-wrapper" class="p-8">
    <h1 class="text-4xl font-bold mb-8">Proyecto Omega</h1>
    
    <div id="theme-buttons-container" class="flex gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
      <button data-set-theme="Dark" class="px-4 py-2 border rounded hover:bg-white/10 cursor-pointer">Dark Mode</button>
      <button data-set-theme="Light" class="px-4 py-2 border rounded hover:bg-white/10 cursor-pointer">Light Mode</button>
      <button data-set-theme="Terminal" class="px-4 py-2 border rounded hover:bg-white/10 cursor-pointer">Terminal</button>
    </div>
  </div>
`;

// 3. Activamos los listeners (pasando el ID exacto que pusimos arriba)
themeService.setupEventListeners("theme-buttons-container");
