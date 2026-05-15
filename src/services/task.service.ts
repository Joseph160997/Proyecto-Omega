import type { Task, TaskDTO } from "../interfaces/task.interface";
import { TaskMapper } from "../mappers/task.mapper";

const API_URL = "https://jsonplaceholder.typicode.com/todos";
const options = {
  method: "GET",
  headers: {
    accept: "application/json",
    contentType: "application/json",
    // Authorization: `Bearer ${API_KEY}`,
  },
};

export const TaskService = {
  async getTasks(limit: number = 10): Promise<Task[]> {
    const url = `${API_URL}?_limit=${limit}`;

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
