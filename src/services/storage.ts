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
const DB_VERSION = 1;

// Nombre de nuestra "tabla" principal (Object Store).
// Aquí guardaremos todo usando el patrón clave-valor.
const STORE_NAME = "keyval";

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
};
