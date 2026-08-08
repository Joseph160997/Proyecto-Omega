// =========================================================================
// SERVICE: INDEXEDDB WRAPPER (PROYECTO OMEGA) - OPTIMIZADO
// =========================================================================

// 1. CONFIGURACIÓN INICIAL DE LA BASE DE DATOS
// -------------------------------------------------------------------------
// Nombre de la base de datos que aparecerá en las DevTools del navegador.
const DB_NAME = "OmegaDB";

// Versión estructural de la base de datos.
// Si en el futuro necesitas crear más "tablas" (stores), debes subir este
// número a 2 para que se vuelva a ejecutar el evento 'onupgradeneeded'.
const DB_VERSION = 2;

// Nombre de nuestra "tabla" principal (Object Store).
// Aquí guardaremos todo usando el patrón clave-valor.
const STORE_NAME = "keyval";

// Nombres de stores adicionales para series temporales y carritos
const HISTORY_STORE = "history";
const CART_STORE = "cart";
const TASKS_STORE = "tasks";

// 2. PATRÓN SINGLETON (CACHÉ DE MEMORIA)
// -------------------------------------------------------------------------
// Esta variable mantiene la conexión al disco duro abierta.
// Evita el colapso de rendimiento de abrir y cerrar la base de datos
// cada vez que queremos guardar un simple dato.
let dbInstance: IDBDatabase | null = null;

/**
 * Abre la conexión física con el disco duro del navegador o
 * devuelve la conexión si ya estaba abierta previamente.
 */
const openDatabase = (): Promise<IDBDatabase> => {
  // Si la conexión ya existe en memoria, la retornamos
  // instantáneamente envuelta en una Promesa resuelta.
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  // Si no hay conexión, creamos una nueva Promesa para gestionar
  // el proceso asíncrono de apertura.
  return new Promise((resolve, reject) => {
    // Solicitamos al navegador abrir la base de datos.
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // EVENTO 1: Creación o Actualización (Schema Setup)
    // Solo se dispara la primerísima vez que el usuario entra a la app,
    // o cuando incrementamos el DB_VERSION.
    request.onupgradeneeded = () => {
      const db = request.result;

      // Verificamos si nuestra tabla "keyval" ya existe.
      // Si no existe, la creamos en este preciso momento.
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      
      // Crear stores adicionales si no existen
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE);
      }
      
      if (!db.objectStoreNames.contains(CART_STORE)) {
        db.createObjectStore(CART_STORE);
      }
      
      if (!db.objectStoreNames.contains(TASKS_STORE)) {
        db.createObjectStore(TASKS_STORE);
      }
    };

    // EVENTO 2: Conexión Exitosa
    // Se dispara cuando la base de datos está lista para usarse.
    request.onsuccess = () => {
      // Guardamos la conexión en la variable global (Singleton)
      dbInstance = request.result;

      // Liberamos la promesa entregando la base de datos
      resolve(dbInstance);
    };

    // EVENTO 3: Error Crítico
    // Ocurre si el navegador bloquea IndexedDB (ej. modo incógnito estricto).
    request.onerror = () => {
      // Usamos Nullish Coalescing (??) por si request.error es null
      reject(request.error ?? new Error("Error opening IndexedDB."));
    };

    // EVENTO 4: Bloqueo de Versión
    // Ocurre si hay otra pestaña abierta usando una versión más antigua.
    request.onblocked = () => {
      reject(new Error("IndexedDB opening is blocked."));
    };
  });
};

// 3. UTILERÍAS DE PROMESAS (HELPERS)
// -------------------------------------------------------------------------

/**
 * Transforma las respuestas antiguas de IndexedDB (IDBRequest)
 * en Promesas modernas tipadas para poder usar async/await.
 */
const requestToPromise = <T>(
  request: IDBRequest<T>,
): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    // Si la búsqueda tiene éxito, devolvemos el resultado.
    request.onsuccess = () => resolve(request.result);

    // Si falla, devolvemos el error.
    request.onerror = () =>
      reject(request.error ?? new Error("Request failed."));
  });
};

/**
 * Observa una transacción completa de escritura.
 * Garantiza que los datos se hayan guardado físicamente en el disco
 * antes de continuar con la ejecución de la aplicación.
 */
const transactionComplete = (transaction: IDBTransaction): Promise<void> => {
  return new Promise((resolve, reject) => {
    // La escritura se confirmó en el disco.
    transaction.oncomplete = () => resolve();

    // La escritura fue cancelada a mitad de camino.
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Aborted."));

    // Fallo técnico del sistema de archivos.
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Failed."));
  });
};

// 4. EL OBJETO DE SERVICIO EXPORTADO (CRUD INTERFACE)
// -------------------------------------------------------------------------

/**
 * Interfaz para datos con timestamp (para caché e historial)
 */
export interface TimestampedData<T> {
  data: T;
  timestamp: number;
}

export const storage = {
  /**
   * CREATE / UPDATE (Guardar o Actualizar)
   * Modo de transacción: "readwrite" (Escritura requerida)
   */
  async save<T>(key: string, data: T): Promise<void> {
    // Validación de seguridad vital
    if (!key) throw new Error("Key cannot be empty.");

    // 1. Obtenemos la conexión a la base de datos.
    const db = await openDatabase();

    // 2. Iniciamos una transacción de escritura.
    const transaction = db.transaction(STORE_NAME, "readwrite");

    // 3. Apuntamos a nuestra tabla específica.
    const store = transaction.objectStore(STORE_NAME);

    // 4. Inyectamos los datos bajo su llave.
    store.put(data, key);

    // 5. Esperamos a que la transacción finalice en el disco.
    return transactionComplete(transaction);
  },

  /**
   * SAVE con timestamp (para caché con información de frescura)
   */
  async saveWithTimestamp<T>(key: string, data: T): Promise<void> {
    const timestamped: TimestampedData<T> = {
      data,
      timestamp: Date.now(),
    };
    return this.save(key, timestamped);
  },

  /**
   * GET con timestamp (devuelve null si no hay timestamp)
   */
  async getWithTimestamp<T>(key: string): Promise<TimestampedData<T> | null> {
    const result = await this.get<TimestampedData<T>>(key);
    return result && result.timestamp ? result : null;
  },

  /**
   * READ (Leer un dato)
   * Modo de transacción: "readonly" (Más rápido, no bloquea el disco)
   */
  async get<T>(key: string): Promise<T | null> {
    // Validación de seguridad vital
    if (!key) throw new Error("Key cannot be empty.");

    // 1. Obtenemos la conexión.
    const db = await openDatabase();

    // 2. Iniciamos una transacción de SOLO LECTURA.
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);

    // 3. Solicitamos el dato específico.
    const request = store.get(key);

    // 4. Esperamos la promesa de la petición.
    const result = await requestToPromise<T | undefined>(request);

    // Si la llave no existe, result es undefined.
    // Lo convertimos a null por seguridad y estandarización.
    return result === undefined ? null : result;
  },

  /**
   * DELETE (Borrar un dato específico)
   * Modo de transacción: "readwrite"
   */
  async delete(key: string): Promise<void> {
    if (!key) throw new Error("Key cannot be empty.");

    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Orden de eliminación nativa de IndexedDB
    store.delete(key);

    return transactionComplete(transaction);
  },

  /**
   * CLEAR (Borrar TODA la tabla / Resetear estado)
   * Modo de transacción: "readwrite"
   */
  async clear(): Promise<void> {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    // Destruye todos los registros dentro del object store
    store.clear();

    return transactionComplete(transaction);
  },

  /**
   * HISTORIAL: Agrega un snapshot a una serie temporal
   * Útil para guardar evolución de precios de cripto u otros datos históricos
   */
  async addToHistory<T>(category: string, data: T, maxEntries = 10): Promise<void> {
    const historyKey = `history:${category}`;
    const existing = await this.get<T[]>(historyKey);
    const history = existing || [];
    
    // Agregar nuevo dato al inicio
    history.unshift(data);
    
    // Mantener solo los últimos maxEntries
    if (history.length > maxEntries) {
      history.splice(maxEntries);
    }
    
    await this.save(historyKey, history);
  },

  /**
   * HISTORIAL: Obtiene la serie temporal completa
   */
  async getHistory<T>(category: string): Promise<T[]> {
    const historyKey = `history:${category}`;
    return (await this.get<T[]>(historyKey)) || [];
  },

  /**
   * CARRITO: Agrega un producto al carrito
   */
  async addToCart(product: { id: number; title: string; price: number; quantity: number }): Promise<void> {
    const cart = await this.getCart();
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      existingItem.quantity += product.quantity;
    } else {
      cart.push(product);
    }
    
    await this.save(CART_STORE, cart);
  },

  /**
   * CARRITO: Obtiene todos los items del carrito
   */
  async getCart(): Promise<Array<{ id: number; title: string; price: number; quantity: number }>> {
    return (await this.get<Array<{ id: number; title: string; price: number; quantity: number }>>(CART_STORE)) || [];
  },

  /**
   * CARRITO: Remueve un item del carrito
   */
  async removeFromCart(productId: number): Promise<void> {
    const cart = await this.getCart();
    const filtered = cart.filter(item => item.id !== productId);
    await this.save(CART_STORE, filtered);
  },

  /**
   * CARRITO: Limpia todo el carrito
   */
  async clearCart(): Promise<void> {
    await this.save(CART_STORE, []);
  },

  /**
   * CARRITO: Obtiene el total de items en el carrito
   */
  async getCartCount(): Promise<number> {
    const cart = await this.getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
  },

  /**
   * TAREAS: Guarda el estado de una tarea (para persistir cambios de drag & drop)
   */
  async saveTaskStatus(taskId: number, status: string): Promise<void> {
    const taskKey = `task:${taskId}`;
    await this.save(taskKey, status);
  },

  /**
   * TAREAS: Obtiene el estado guardado de una tarea
   */
  async getTaskStatus(taskId: number): Promise<string | null> {
    return await this.get<string>(`task:${taskId}`);
  },

  /**
   * TAREAS: Obtiene todos los estados de tareas guardados
   */
  async getAllTaskStatuses(): Promise<Record<number, string>> {
    const db = await openDatabase();
    const transaction = db.transaction(TASKS_STORE, "readonly");
    const store = transaction.objectStore(TASKS_STORE);
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result as Array<{ key: number; value: string }>;
        const statuses: Record<number, string> = {};
        results.forEach(item => {
          statuses[item.key] = item.value;
        });
        resolve(statuses);
      };
      request.onerror = () => reject(request.error ?? new Error("Failed to get task statuses"));
    });
  },
};
