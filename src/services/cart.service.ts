import { storage } from "./storage";
import { eventBus, AppEvents } from "./pubsub";
import { ToastService } from "../ui/Toast";

export interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
}

class CartServiceClass {
  private cartCount: number = 0;
  private cartItems: CartItem[] = [];
  private countElement: HTMLElement | null = null;

  /**
   * Inicializa el servicio cargando el carrito desde IndexedDB
   */
  async init(): Promise<void> {
    try {
      this.cartItems = await storage.getCart();
      this.cartCount = await storage.getCartCount();
      this.updateCountDisplay();
      console.log(`[Cart] Initialized with ${this.cartCount} items`);
    } catch (error) {
      console.error("[Cart] Error initializing:", error);
    }
  }

  /**
   * Agrega un producto al carrito
   */
  async addToCart(product: { id: number; title: string; price: number }): Promise<void> {
    try {
      await storage.addToCart({ ...product, quantity: 1 });
      
      // Actualizar estado local
      this.cartItems = await storage.getCart();
      this.cartCount = await storage.getCartCount();
      
      // Actualizar UI
      this.updateCountDisplay();
      
      // Notificar vía event bus
      eventBus.publish(AppEvents.PRODUCT_ADDED_TO_CART, product);
      
      // Mostrar toast de éxito
      ToastService.success(`${product.title.substring(0, 30)}... agregado al carrito`, 2500);
      
      console.log(`[Cart] Added: ${product.title}`);
    } catch (error) {
      console.error("[Cart] Error adding to cart:", error);
      ToastService.error("Error al agregar producto", 3000);
    }
  }

  /**
   * Remueve un producto del carrito
   */
  async removeFromCart(productId: number): Promise<void> {
    try {
      await storage.removeFromCart(productId);
      this.cartItems = await storage.getCart();
      this.cartCount = await storage.getCartCount();
      this.updateCountDisplay();
      console.log(`[Cart] Removed item ${productId}`);
    } catch (error) {
      console.error("[Cart] Error removing from cart:", error);
    }
  }

  /**
   * Obtiene todos los items del carrito
   */
  getItems(): CartItem[] {
    return this.cartItems;
  }

  /**
   * Obtiene el total de items
   */
  getCount(): number {
    return this.cartCount;
  }

  /**
   * Obtiene el total monetario del carrito
   */
  getTotal(): number {
    return this.cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  /**
   * Limpia todo el carrito
   */
  async clear(): Promise<void> {
    try {
      await storage.clearCart();
      this.cartItems = [];
      this.cartCount = 0;
      this.updateCountDisplay();
      ToastService.info("Carrito vaciado", 2000);
    } catch (error) {
      console.error("[Cart] Error clearing cart:", error);
    }
  }

  /**
   * Actualiza el display del contador en el header
   */
  private updateCountDisplay(): void {
    if (!this.countElement) {
      this.countElement = document.getElementById("cart-count");
    }
    
    if (this.countElement) {
      this.countElement.textContent = this.cartCount.toString();
      this.countElement.style.display = this.cartCount > 0 ? "inline-block" : "none";
      
      // Animación de pulso cuando hay items
      if (this.cartCount > 0) {
        this.countElement.classList.add("animate-pulse");
      }
    }
  }

  /**
   * Renderiza el panel lateral del carrito
   */
  renderCartPanel(): string {
    if (this.cartItems.length === 0) {
      return `
        <div class="p-8 text-center text-[var(--text-secondary)]">
          <p class="text-sm mb-4">El carrito está vacío</p>
          <button onclick="document.dispatchEvent(new CustomEvent('close-cart'))" 
            class="px-4 py-2 bg-[var(--brand-color)] text-[var(--bg-color)] rounded-lg text-xs font-bold uppercase tracking-wide hover:brightness-110 transition-all">
            Continuar comprando
          </button>
        </div>
      `;
    }

    const itemsHtml = this.cartItems.map(item => `
      <div class="flex items-center gap-3 p-3 border-b border-[var(--panel-border)] last:border-0">
        <div class="flex-1 min-w-0">
          <p class="text-xs font-medium text-[var(--text-primary)] truncate">${item.title}</p>
          <p class="text-[10px] text-[var(--text-secondary)]">${item.quantity} x $${item.price.toFixed(2)}</p>
        </div>
        <button data-remove-cart="${item.id}" 
          class="text-[var(--text-secondary)] hover:text-rose-400 transition-colors p-1"
          aria-label="Remover ${item.title}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    `).join("");

    return `
      <div class="flex flex-col h-full">
        <div class="p-4 border-b border-[var(--panel-border)] flex justify-between items-center">
          <h3 class="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">Tu Carrito (${this.cartCount} items)</h3>
          <button onclick="document.dispatchEvent(new CustomEvent('close-cart'))" 
            class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Cerrar carrito">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto p-4">
          ${itemsHtml}
        </div>
        
        <div class="p-4 border-t border-[var(--panel-border)] bg-[var(--bg-color)]">
          <div class="flex justify-between items-center mb-4">
            <span class="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Total</span>
            <span class="text-lg font-black text-[var(--brand-color)]">$${this.getTotal().toFixed(2)}</span>
          </div>
          <div class="flex gap-2">
            <button onclick="OmegaCart.clear()" 
              class="flex-1 px-3 py-2 border border-[var(--panel-border)] text-[var(--text-secondary)] rounded-lg text-xs font-bold uppercase tracking-wide hover:border-rose-500/50 hover:text-rose-400 transition-all">
              Vaciar
            </button>
            <button class="flex-[2] px-3 py-2 bg-[var(--brand-color)] text-[var(--bg-color)] rounded-lg text-xs font-bold uppercase tracking-wide hover:brightness-110 transition-all shadow-[0_0_15px_var(--glow-color)]">
              Checkout
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

export const CartService = new CartServiceClass();

// Exponer globalmente para acceso desde HTML inline
declare global {
  interface Window {
    OmegaCart: typeof CartService;
  }
}
window.OmegaCart = CartService;
