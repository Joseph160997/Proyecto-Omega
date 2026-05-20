import type { Task } from "../interfaces/task.interface";

/**
 * Genera el HTML de una tarjeta de tarea individual.
 * @param task Un objeto de tipo Task que contiene los datos de la tarea a renderizar.
 * @returns Un string con el HTML de la tarjeta de tarea.
 */
const renderTaskCard = (task: Task): string => {
  // Asignamos un color sutil al ID según el estado para mantener el código visual
  const badgeColors = {
    todo: "text-slate-400 bg-slate-400/10 border-slate-400/20",
    "in-progress": "text-amber-400 bg-amber-400/10 border-amber-400/20",
    done: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  };

  return `
    <div class="bg-slate-950/60 border border-white/5 p-4 rounded-lg hover:border-slate-700 transition-all duration-200 group/card shadow-sm">
      <div class="flex justify-between items-start gap-2 mb-2">
        <span class="text-[9px] font-mono px-1.5 py-0.5 rounded border ${badgeColors[task.status]} tracking-tighter">
          TSK-${task.id.toString().padStart(3, "0")}
        </span>
        <button class="text-slate-600 hover:text-slate-400 text-xs transition-colors cursor-pointer opacity-0 group-hover/card:opacity-100">
          ⚙️
        </button>
      </div>
      <p class="text-xs text-slate-300 font-medium line-clamp-3 group-hover/card:text-white transition-colors leading-relaxed">
        ${task.title}
      </p>
    </div>
  `;
};

/**
 * Genera la estructura completa del Tablero Kanban dividido en 3 columnas optimizadas.
 * @param tasks Lista de tareas mapeadas del dominio.
 * @return Un string con el HTML completo del Task Board, listo para ser insertado en el DOM.
 * @description
 * Esta función se encarga de renderizar el Task Board completo, clasificando las tareas en sus respectivas columnas según su estado (todo, in-progress, done).
 * Cada columna muestra un contador dinámico de tareas y un mensaje amigable cuando no hay tareas en esa categoría.
 * Además, cada tarea se renderiza utilizando la función renderTaskCard para mantener una apariencia consistente y atractiva.
 */
export const renderTaskBoard = (tasks: Task[]): string => {
  // Clasificamos las tareas usando el método filter de JavaScript
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      
      <!-- COLUMNA: POR HACER (BACKLOG) -->
      <div class="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col min-h-62.5">
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]"></span>
            <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400">Backlog</h3>
          </div>
          <span class="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">${todoTasks.length}</span>
        </div>
        <div class="flex flex-col gap-3 dynamic-task-list">
          ${todoTasks.length > 0 ? todoTasks.map((t) => renderTaskCard(t)).join("") : '<p class="text-[11px] text-slate-600 font-mono text-center py-6 uppercase tracking-wider">No pending tasks</p>'}
        </div>
      </div>

      <!-- COLUMNA: EN PROCESO (IN PRODUCTION) -->
      <div class="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col min-h-62.5">
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
            <h3 class="text-xs font-bold uppercase tracking-widest text-amber-400">In Production</h3>
          </div>
          <span class="text-xs font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">${inProgressTasks.length}</span>
        </div>
        <div class="flex flex-col gap-3 dynamic-task-list">
          ${inProgressTasks.length > 0 ? inProgressTasks.map((t) => renderTaskCard(t)).join("") : '<p class="text-[11px] text-slate-600 font-mono text-center py-6 uppercase tracking-wider">Zero active tasks</p>'}
        </div>
      </div>

      <!-- COLUMNA: COMPLETADO (DEPLOYED) -->
      <div class="bg-slate-900/30 border border-white/5 rounded-xl p-4 flex flex-col min-h-62.5">
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            <h3 class="text-xs font-bold uppercase tracking-widest text-emerald-400">Deployed</h3>
          </div>
          <span class="text-xs font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">${doneTasks.length}</span>
        </div>
        <div class="flex flex-col gap-3 dynamic-task-list">
          ${doneTasks.length > 0 ? doneTasks.map((t) => renderTaskCard(t)).join("") : '<p class="text-[11px] text-slate-600 font-mono text-center py-6 uppercase tracking-wider">No builds completed</p>'}
        </div>
      </div>

    </div>
  `;
};
