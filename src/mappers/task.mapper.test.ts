import { describe, it, expect, vi, afterEach } from "vitest";
import { TaskMapper } from "./task.mapper";
import type { TaskDTO } from "../interfaces/task.interface";

describe("TaskMapper", () => {
  // Limpiamos los mocks después de cada test para mantener el entorno limpio
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("toDomain", () => {
    // TEST 1: Probar el flujo cuando la tarea está completada
    it("should map to 'done' status when the task is completed", () => {
      // 1. ARRANGE
      const mockDto: TaskDTO = {
        userId: 1,
        id: 1,
        title: "Test Task",
        completed: true, // Forzamos a que esté completada
      };

      // 2. ACT
      const result = TaskMapper.toDomain(mockDto);

      // 3. ASSERT
      expect(result.id).toBe(1);
      expect(result.title).toBe("Test Task");
      expect(result.status).toBe("done"); // Verificamos la transformación correcta
    });

    // TEST 2: Probar cuando no está completada y el random es menor a 0.5 (Cae en 'todo')
    it("should map to 'todo' status when task is not completed and random is less than 0.5", () => {
      // 1. ARRANGE
      const mockDto: TaskDTO = {
        userId: 1,
        id: 2,
        title: "Incomplete Task 1",
        completed: false, // Forzamos el bloque else
      };

      // Interceptamos Math.random para que devuelva 0.3 (menor que 0.5)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.3);

      // 2. ACT
      const result = TaskMapper.toDomain(mockDto);

      // 3. ASSERT
      expect(randomSpy).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(2);
      expect(result.status).toBe("todo"); // 0.3 < 0.5 resulta en "todo"
    });

    // TEST 3: Probar cuando no está completada y el random es mayor o igual a 0.5 (Cae en 'in-progress')
    it("should map to 'in-progress' status when task is not completed and random is greater than or equal to 0.5", () => {
      // 1. ARRANGE
      const mockDto: TaskDTO = {
        userId: 1,
        id: 3,
        title: "Incomplete Task 2",
        completed: false,
      };

      // Interceptamos Math.random para que devuelva 0.7 (mayor que 0.5)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.7);

      // 2. ACT
      const result = TaskMapper.toDomain(mockDto);

      // 3. ASSERT
      expect(randomSpy).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(3);
      expect(result.status).toBe("in-progress"); // 0.7 >= 0.5 resulta en "in-progress"
    });
  });

  describe("toDomainList", () => {
    // TEST 4: Probar el mapeo de una lista de tareas de forma dinámica
    it("should map a list of tasks with mixed random statuses", () => {
      // ==========================================
      // 1. ARRANGE (PREPARAR)
      // ==========================================
      const mockDtoList: TaskDTO[] = [
        {
          userId: 1,
          id: 1,
          title: "Test Task 1",
          completed: true, // Esto será "done" directamente (no consume random)
        },
        {
          userId: 1,
          id: 2,
          title: "Test Task 2",
          completed: false, // Primera llamada al else (queremos que sea "todo")
        },
        {
          userId: 1,
          id: 3,
          title: "Test Task 3",
          completed: false, // Segunda llamada al else (queremos que sea "in-progress")
        },
      ];

      // Configuramos el espía de forma secuencial:
      // Primera ejecución en el else devolverá 0.3 (0.3 < 0.5 -> "todo")
      // Segunda ejecución en el else devolverá 0.7 (0.7 >= 0.5 -> "in-progress")
      const randomSpy = vi
        .spyOn(Math, "random")
        .mockReturnValueOnce(0.3)
        .mockReturnValueOnce(0.7);

      // ==========================================
      // 2. ACT (EJECUTAR)
      // ==========================================
      const result = TaskMapper.toDomainList(mockDtoList);

      // ==========================================
      // 3. ASSERT (COMPROBAR)
      // ==========================================
      // Verificamos que Math.random solo se llamó 2 veces en total (la tarea completada no lo usa)
      expect(randomSpy).toHaveBeenCalledTimes(2);
      expect(result.length).toBe(3);

      // Tarea 1: Completada -> "done"
      expect(result[0].id).toBe(1);
      expect(result[0].title).toBe("Test Task 1");
      expect(result[0].status).toBe("done");

      // Tarea 2: No completada + Random 0.3 -> "todo"
      expect(result[1].id).toBe(2); //
      expect(result[1].title).toBe("Test Task 2");
      expect(result[1].status).toBe("todo");

      // Tarea 3: No completada + Random 0.7 -> "in-progress" (corregido el error ortográfico)
      expect(result[2].id).toBe(3);
      expect(result[2].title).toBe("Test Task 3");
      expect(result[2].status).toBe("in-progress");
    });

    // TEST 5: Probar el mapeo de una lista de tareas vacía
    it("should map an empty list of tasks", () => {
      // 1. ARRANGE
      const mockDtoList: TaskDTO[] = [];

      // 2. ACT
      const result = TaskMapper.toDomainList(mockDtoList);

      // 3. ASSERT
      expect(result).toEqual([]);
    });

    // TEST 6: Probar el mapeo de una lista de tareas nula
    it("should map a null list of tasks", () => {
      // 1. ARRANGE
      const mockDtoList: TaskDTO[] = null as unknown as TaskDTO[];

      // 2. ACT
      const result = TaskMapper.toDomainList(mockDtoList);

      // 3. ASSERT
      expect(result).toEqual([]);
    });
  });
});
