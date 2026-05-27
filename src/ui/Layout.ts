/**
 * Componente que genera la estructura base y el esqueleto de la aplicación.
 * Define el Header, el contenedor del Dashboard de Temas, y las secciones
 * vacías con sus IDs listos para recibir los datos de los módulos.
 * * @returns {string} El HTML completo del cascarón de la aplicación.
 */
export const renderLayout = (): string => {
  return `
    <header class="w-full p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50"> 
      <div class="max-w-7xl mx-auto flex justify-between items-center">
        <h1 class="text-2xl font-bold tracking-tighter text-blue-400">
          PROYECTO <span class="text-white">OMEGA</span>
        </h1>
        <nav id="main-nav">
          <ul class="flex gap-6 text-sm uppercase tracking-wide">
            <li data-page="market" class="text-slate-400 pb-1 cursor-pointer">Market</li>
            <li data-page="inventory" class="text-slate-400 pb-1 cursor-pointer">Inventory</li>
            <li data-page="kanban" class="text-slate-400 pb-1 cursor-pointer">Kanban</li>
          </ul>
        </nav>
      </div>
    </header>

    <main class="flex-1 w-full max-w-7xl mx-auto p-6">
      
      <section class="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/5 p-4 rounded-xl border border-white/10 shadow-sm">
        <div>
          <h2 class="text-xl font-bold text-slate-200">System Dashboard</h2>
          <p class="text-xs text-slate-500">Configuración global y estado</p>
        </div>
        <div id="theme-buttons-container" class="flex gap-2 mt-4 sm:mt-0"></div>
      </section>

      <div id="content-view"class="grid grid-cols-1 gap-12">
        
       

      </div>
    </main>

    <footer class="w-full p-8 border-t border-slate-800 text-center text-slate-500 text-xs">
      <p>&copy; 2026 Proyecto Omega - Built with Senior Mindset</p>
    </footer>
  `;
};
