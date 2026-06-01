import type { Task, TaskDTO } from "../interfaces/task.interface";
import { TaskMapper } from "../mappers/task.mapper";
import { env } from "../config/env";
import { fetchWithCache } from "../utils/fetchWithCache";

const fetchOptions: RequestInit = {
  method: "GET",
  headers: { accept: "application/json" },
};

export const TaskService = {
  async getTasks(limit: number = 10): Promise<Task[]> {
    const url = `${env.apiTasks}?_limit=${limit}`;

    return fetchWithCache<TaskDTO[], Task[]>(
      url,
      "omega_tasks",
      TaskMapper.toDomainList,
      fetchOptions,
    );
  },
};
