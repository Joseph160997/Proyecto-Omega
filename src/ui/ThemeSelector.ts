/**
 * Componente puro que genera los botones controladores del tema visual.
 * Cada botón expone el atributo personalizado 'data-set-theme' que es
 * capturado por la delegación de eventos del themeService.
 * @returns {string} Fragmento de HTML con los botones de temas.
 */
export const renderThemeSelector = (): string => {
  return `
    <button data-set-theme="DeepSpace" 
      class="px-5 py-2.5 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-[var(--brand-color)] cursor-pointer text-sm font-medium transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-[0_0_20px_var(--glow-color)] hover:-translate-y-0.5">
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
        Deep Space
      </span>
    </button>
    
    <button data-set-theme="NeonCyber" 
      class="px-5 py-2.5 rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-[var(--brand-color)] cursor-pointer text-sm font-medium transition-all duration-300 backdrop-blur-sm shadow-lg hover:shadow-[0_0_20px_var(--glow-color)] hover:-translate-y-0.5">
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
        Neon Cyber
      </span>
    </button>
  `;
};
