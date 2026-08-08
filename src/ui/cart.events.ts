import { CartService } from "../services/cart.service";
import { eventBus, AppEvents } from "../services/pubsub";
import { ProductService } from "../services/product.services";

/**
 * Configura los eventos relacionados con el carrito de compras
 */
export const setupCartEvents = async (): Promise<void> => {
  // Inicializar el servicio del carrito
  await CartService.init();

  // Toggle del panel del carrito desde el header
  const cartToggle = document.getElementById("cart-toggle");
  const cartPanel = document.getElementById("cart-panel");
  const cartOverlay = document.getElementById("cart-overlay");

  if (cartToggle && cartPanel && cartOverlay) {
    const toggleCart = () => {
      const isHidden = cartPanel.style.display === "none" || !cartPanel.style.display;
      
      if (isHidden) {
        // Mostrar carrito
        cartPanel.style.display = "block";
        cartOverlay.style.display = "block";
        
        // Renderizar contenido
        const panelContent = CartService.renderCartPanel();
        cartPanel.innerHTML = panelContent;
        
        // Animación de entrada
        setTimeout(() => {
          cartPanel.classList.remove("translate-x-full");
        }, 10);
        
        // Setup de eventos para botones de remover
        setupRemoveButtons();
      } else {
        // Ocultar carrito
        closeCart();
      }
    };

    const closeCart = () => {
      cartPanel.classList.add("translate-x-full");
      setTimeout(() => {
        cartPanel.style.display = "none";
        cartOverlay.style.display = "none";
      }, 300);
    };

    cartToggle.addEventListener("click", toggleCart);
    cartOverlay.addEventListener("click", closeCart);
    
    // Escuchar evento global de cerrar carrito
    document.addEventListener("close-cart", closeCart);
  }

  // Delegación de eventos para botones de agregar al carrito en Inventory
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;
    const addButton = target.closest("[data-add-cart]");
    
    if (addButton) {
      const productId = parseInt(addButton.getAttribute("data-add-cart")!);
      
      try {
        const products = await ProductService.getProducts(100);
        const product = products.find(p => p.id === productId);
        
        if (product) {
          await CartService.addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
          });
        }
      } catch (error) {
        console.error("[Cart] Error adding product:", error);
      }
    }
  });

  // Función para setup de botones de remover en el panel del carrito
  const setupRemoveButtons = () => {
    const removeButtons = document.querySelectorAll("[data-remove-cart]");
    removeButtons.forEach(btn => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const productId = parseInt((btn as HTMLElement).getAttribute("data-remove-cart")!);
        await CartService.removeFromCart(productId);
        
        // Re-renderizar panel
        const cartPanel = document.getElementById("cart-panel");
        if (cartPanel) {
          cartPanel.innerHTML = CartService.renderCartPanel();
          setupRemoveButtons(); // Re-setup después de re-renderizar
        }
      });
    });
  };

  // Suscribirse a eventos del carrito para logging/analytics
  eventBus.subscribe(AppEvents.PRODUCT_ADDED_TO_CART, (data) => {
    console.log("[EventBus] Product added to cart:", data);
  });
};
