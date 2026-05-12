/**
 * Un servicio de almacenamiento que proporciona métodos para guardar y recuperar datos en localStorage.
 * Utiliza JSON para serializar los datos al guardarlos y para parsearlos al recuperarlos.
 * El método `save` guarda un valor de tipo genérico `T` bajo una clave específica, mientras que el método `get` recupera el valor asociado a una clave y lo devuelve como tipo `T` o `null` si no existe o si ocurre un error.
 * @template T El tipo de datos que se va a guardar o recuperar.
 * @returns Un objeto con métodos `save` y `get` para interactuar con localStorage.
 */
export const storage = {
  save<T>(key: string, data: T): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
    } catch (error) {
      console.error(`Error saving data to localStorage: ${error}`);
    }
  },

  get<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === "") return null;
    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      console.error(`Error parsing data from localStorage: ${error}`);
      return null;
    }
  },
};
