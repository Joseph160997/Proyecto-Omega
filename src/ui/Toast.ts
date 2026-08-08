/**
 * Componente Toast para mostrar mensajes en la parte inferior de la pantalla.
 * @module Toast
 * @param {string} message - El mensaje a mostrar en el Toast.
 * @param {number} duration - La duración en milisegundos del Toast. Por defecto es 3000 (3 segundos).
 */
export const ToastService = {
  show(message: string, duration: number = 3000): void {
    // Crear el elemento Toast
    const toast = document.createElement("div");

    // Asignar clases CSS para el estilo del Toast.
    toast.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-rose-950/90 border border-rose-500/30 p-4 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono text-rose font-semibold tracking-wide anime-bounce transition-all duration-300 ease-in-out`;

    // Inyectar el marcado con un icono indicativo de fallo de sistema y el mensaje de error.
    toast.innerHTML = `
       <span class="flex h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
       <span>[SYSTEM ERROR]: ${message}</span>
    `;

    // Agregar el Toast al DOM
    document.body.appendChild(toast);

    // Eliminar el Toast despues de la duración especificada
    // APLICAMOS UN DESVANECIMIENTO ANTES DE REMOVERLO
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";

      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  },
};
