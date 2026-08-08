import type { Task, TaskDTO, TaskStatus } from "../interfaces/task.interface";

export class TaskMapper {
  /**
   * Convierte un objeto de tipo TaskDTO a un objeto de tipo Task.
   * @param dto El objeto de tipo TaskDTO que se desea convertir.
   * @returns Un objeto de tipo Task con los datos mapeados desde el DTO.
   */
  static toDomain(dto: TaskDTO): Task {
    // 1. AQUI CALCULAMOS EL STATUS ANTES DE RETORNAR.
    let finalStatus: TaskStatus;
    if (dto.completed) {
      finalStatus = "done";
    } else {
      // Si es false, usamos una semilla basada en dto.id para asignar deterministicamente "todo" o "in-progress"
      // Esto evita que una tarea "salte" de columna aleatoriamente en cada carga.
      finalStatus = dto.id % 2 === 0 ? "todo" : "in-progress";
    }
    // 2. RETORNAMOS EL OBJETO DE TIPO Task CON LOS CAMPOS MAPEADOS DESDE EL DTO.
    return {
      id: dto.id,
      title: dto.title,
      status: finalStatus,
    };
  }
  /**
   * Mapea un array de tareas en formato TaskDTO a un array de tareas en formato Task.
   * @param dtoList Un array de objetos de tipo TaskDTO que se desean convertir.
   * @returns Un array de objetos de tipo Task con los datos mapeados desde los DTOs.
   */
  static toDomainList(dtoList: TaskDTO[]): Task[] {
    if (!Array.isArray(dtoList)) return []; // Validación para asegurarnos de que el input es un array
    return dtoList.map((dto) => TaskMapper.toDomain(dto));
  }
}
