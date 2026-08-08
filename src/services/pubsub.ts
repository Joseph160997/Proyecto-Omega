/**
 * PubSub (Publish/Subscribe) - Event Bus Central
 * Permite comunicación entre módulos sin acoplamiento directo.
 * Market, Inventory y Kanban pueden publicar y escuchar eventos.
 */

type EventCallback = (data?: unknown) => void;

class PubSub {
  private events: Map<string, Set<EventCallback>>;

  constructor() {
    this.events = new Map();
  }

  /**
   * Suscribe un callback a un evento específico.
   */
  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);

    // Retorna función para desuscribirse
    return () => {
      this.events.get(event)?.delete(callback);
    };
  }

  /**
   * Publica un evento con datos opcionales.
   */
  publish(event: string, data?: unknown): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * Limpia todos los listeners de un evento.
   */
  clear(event: string): void {
    this.events.delete(event);
  }

  /**
   * Limpia todos los eventos.
   */
  clearAll(): void {
    this.events.clear();
  }
}

export const eventBus = new PubSub();

// Tipos de eventos del sistema
export const AppEvents = {
  // Eventos de Inventory
  PRODUCT_LOW_STOCK: "inventory:low-stock",
  PRODUCT_ADDED_TO_CART: "inventory:added-to-cart",
  INVENTORY_FILTER_CHANGED: "inventory:filter-changed",
  
  // Eventos de Market
  CRYPTO_PRICE_DROP: "market:price-drop",
  CRYPTO_DATA_UPDATED: "market:data-updated",
  
  // Eventos de Kanban
  TASK_CREATED: "kanban:task-created",
  TASK_MOVED: "kanban:task-moved",
  TASK_DELETED: "kanban:task-deleted",
  
  // Eventos Globales
  GLOBAL_SEARCH: "global:search",
  NAVIGATION_CHANGE: "navigation:change",
  DATA_CACHE_SERVED: "data:cache-served",
} as const;
