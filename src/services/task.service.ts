import { storage } from "./storage";
import type { Task, TaskDTO } from "../interfaces/task.interface";
import { TaskMapper } from "../mappers/task.mapper";

const API_KEY = import.meta.env.VITE_API_TASKS;
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    contentType: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

/**
 * Obtiene la lista de tareas desde la API de JSONPlaceholder, mapeando los datos recibidos a objetos de tipo Task utilizando el TaskMapper.
 * @returns Un array de objetos de tipo Task con los datos de las tareas obtenidos desde la API.
 * @throws Un error si la solicitud a la API falla o si ocurre un error durante el proceso de mapeo.
 */
export const TaskService = {
  async getTasks(limit: number = 10): Promise<Task[]> {
    const url = `${API_KEY}?_limit=${limit}`;

    // Realizamos la peticion a la API de JSONPlaceholder para obtener las tareas.
    try {
      const response = await fetch(url, options);

      // Verificamos si la respuesta es exitosa.
      if (!response.ok) {
        throw new Error(
          `Error fetching data from JSONPlaceholder API: ${response.statusText}`,
        );
      }

      // Parseamos la respuesta JSON a un array de objetos de tipo TaskDTO.
      const data = (await response.json()) as TaskDTO[];

      // Mapeamos el array de TaskDTO a un array de Task utilizando el TaskMapper.
      const tasks = TaskMapper.toDomainList(data);
      return tasks;

      // Manejamos cualquier error que pueda ocurrir durante la solicitud o el mapeo.
    } catch (error) {
      console.error(`Error fetching data from JSONPlaceholder API: ${error}`);
      throw error; // Re-lanzamos el error para que pueda ser manejado por la capa superior (UI).
    }
  },
};

export const TaskStorageService = {
  // Clave utilizada para almacenar las tareas en localStorage.
  STORAGE_KEY: "omega_tasks",

  async getTasks(limit: number = 10): Promise<Task[]> {
    // Primero intentamos obtener las tareas almacenadas en localStorage utilizando el servicio de almacenamiento.
    const cachedTasks = storage.get<Task[]>(this.STORAGE_KEY);

    // Si hay tareas almacenadas y el número de tareas es mayor o igual al límite solicitado, las devolvemos.
    if (cachedTasks && cachedTasks.length > 0) {
      console.log("Tareas obtenidas de localStorage.");
      return cachedTasks;
    }

    // Si no hay tareas almacenadas o el número de tareas es menor que el límite solicitado, obtenemos las tareas de la API.
    const tasks = await TaskService.getTasks(limit);

    // Almacenamos las tareas obtenidas de la API en localStorage para futuras consultas.
    storage.save(this.STORAGE_KEY, tasks);

    return tasks;
  },
};
