/**
 * Componente puro que genera los botones controladores del tema visual.
 * Cada botón expone el atributo personalizado 'data-set-theme' que es
 * capturado por la delegación de eventos del themeService.
 * * @returns {string} Fragmento de HTML con los botones de temas.
 */
export const renderThemeSelector = (): string => {
  return `
    <button data-set-theme="Dark" 
      class="px-4 py-2 border border-white/10 rounded hover:bg-white/10 cursor-pointer text-sm transition-colors">
      Dark
    </button>
    
    <button data-set-theme="Light" 
      class="px-4 py-2 border border-white/10 rounded hover:bg-white/10 cursor-pointer text-sm transition-colors">
      Light
    </button>
    
    <button data-set-theme="Terminal" 
      class="px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10 cursor-pointer text-sm text-green-400 transition-colors">
      Terminal
    </button>
  `;
};
