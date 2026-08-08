/**
 * Componente Toast para mostrar mensajes en la parte inferior de la pantalla.
 * Soporta niveles (info, success, error) y cola de mensajes.
 * @module Toast
 */

type ToastType = "info" | "success" | "error";

interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
}

const toastQueue: ToastConfig[] = [];
let isAnimating = false;

const typeConfig = {
  info: {
    bg: "bg-blue-950/90",
    border: "border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-500",
    prefix: "[INFO]",
  },
  success: {
    bg: "bg-emerald-950/90",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-500",
    prefix: "[SUCCESS]",
  },
  error: {
    bg: "bg-rose-950/90",
    border: "border-rose-500/30",
    text: "text-rose-400",
    dot: "bg-rose-500",
    prefix: "[SYSTEM ERROR]",
  },
};

export const ToastService = {
  /**
   * Muestra un toast con tipo específico
   */
  show(message: string, duration: number = 3000, type: ToastType = "error"): void {
    toastQueue.push({ type, message, duration });
    this.processQueue();
  },

  /**
   * Muestra toast informativo
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, duration, "info");
  },

  /**
   * Muestra toast de éxito
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, duration, "success");
  },

  /**
   * Muestra toast de error
   */
  error(message: string, duration: number = 4000): void {
    this.show(message, duration, "error");
  },

  /**
   * Procesa la cola de toasts
   */
  processQueue(): void {
    if (isAnimating || toastQueue.length === 0) return;

    isAnimating = true;
    const config = toastQueue.shift()!;
    const cfg = typeConfig[config.type];

    // Crear el elemento Toast
    const toast = document.createElement("div");

    // Asignar clases CSS para el estilo del Toast
    toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 ${cfg.bg} ${cfg.border} border p-4 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono ${cfg.text} font-semibold tracking-wide anime-bounce transition-all duration-300 ease-in-out`;

    // Inyectar el marcado con icono y mensaje
    toast.innerHTML = `
       <span class="flex h-2 w-2 rounded-full ${cfg.dot} animate-ping"></span>
       <span>${cfg.prefix}: ${config.message}</span>
    `;

    // Agregar el Toast al DOM
    document.body.appendChild(toast);

    // Eliminar el Toast después de la duración especificada
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";

      setTimeout(() => {
        toast.remove();
        isAnimating = false;
        this.processQueue(); // Procesar siguiente toast en cola
      }, 300);
    }, config.duration);
  },
};
