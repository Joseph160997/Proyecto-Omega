import "./style.css";
import { themeService } from "./services/theme";
import { CryptoService } from "./services/crypto.services";
import { renderCryptoTable } from "./ui/crypto.table";

// 1. Iniciamos el sistema base (Theme)
themeService.init();

// 2. Capturamos el punto de montaje principal
const app = document.querySelector<HTMLElement>("#app")!;

// 3. Inyectamos la estructura (Layout Composition)
// Usamos <section> para dividir la vista en bloques lógicos.
app.innerHTML = `
  <!-- SECCIÓN 1: Controles de Entorno (Theme) -->
  <section class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
    <div>
      <h2 class="text-xl font-bold text-slate-200">System Dashboard</h2>
      <p class="text-xs font-bold text-slate-500">Configuración global y estado</p>
    </div>
    
    <div id="theme-buttons-container" class="flex gap-2 mt-4 sm:mt-0">
      <button data-set-theme="Dark" class="px-4 py-2 border border-white/10 rounded hover:bg-white/10 cursor-pointer text-sm transition-colors">Dark</button>
      <button data-set-theme="Light" class="px-4 py-2 border border-white/10 rounded hover:bg-white/10 cursor-pointer text-sm transition-colors">Light</button>
      <button data-set-theme="Terminal" class="px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10 cursor-pointer text-sm text-green-400 transition-colors">Terminal</button>
    </div>
  </section>

  <!-- SECCIÓN 2: Módulo de Mercado (Cripto Monitor) -->
  <section class="bg-slate-900/50 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
    <div class="p-6 border-b border-white/10 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-blue-400">Market Overview</h2>
        <span class="text-xs text-slate-500 uppercase tracking-widest font-bold">Top 10 Assets</span>
    </div>
    
    <div class="overflow-x-auto"> 
        <table class="w-full text-left border-collapse">
          <thead class="bg-white/5 text-slate-400 uppercase text-xs font-semibold">
            <tr>
              <th class="px-6 py-4">Asset</th>
              <th class="px-6 py-4 text-right">Price</th>
              <th class="px-6 py-4 text-right">24h Change</th>
            </tr>
          </thead>
          <tbody id="crypto-table-body">
            <!-- Loading State (UX Profesional) -->
            <tr>
                <td colspan="3" class="px-6 py-12 text-center">
                    <p class="text-slate-400 animate-pulse font-mono text-sm">Fetching real-time market data...</p>
                </td>
            </tr>
          </tbody>
        </table>
    </div>
  </section>
`;

// 4. Activamos los Listeners de Eventos (Event Delegation)
themeService.setupEventListeners("theme-buttons-container");

// 5. Función asíncrona de arranque de datos
const initMarketModule = async () => {
  try {
    // Llamamos al servicio (Capa de datos)
    const data = await CryptoService.getTopCoins(10);

    // Pasamos los datos limpios a la interfaz (Capa UI)
    renderCryptoTable("crypto-table-body", data);
  } catch (error) {
    // Si algo falla, limpiamos el loading y mostramos el error
    const tbody = document.getElementById("crypto-table-body");
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="3" class="px-6 py-8 text-center text-red-400 font-mono text-sm border-t border-red-500/30 bg-red-500/5">
            Error de conexión con la red de datos.
          </td>
        </tr>`;
    }
  }
};

// 6. Ejecutamos el módulo
initMarketModule();
