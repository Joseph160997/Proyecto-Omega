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
      //Si es false, usamos un (Math.random) para asignar aleatoriamente "todo" o "in-progress" a las tareas que no están completadas, lo que nos permite simular un estado más dinámico para estas tareas dentro de nuestra aplicación.
      finalStatus = Math.random() < 0.5 ? "todo" : "in-progress";
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
    return dtoList.map((dto) => this.toDomain(dto));
  }
}
