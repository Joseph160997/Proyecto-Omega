//=====================================================================
/**
 * 1. Tipo de union literal (LITERAL TYPE UNION)0
 *
 * @description
 * Defini los unicos estados validos que puede tener una tarea
 *
 * @example
 * type TaskStatus = "todo" | "in-progress" | "done";
 *
 * @see https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types
 * @see https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types
 */

export type TaskStatus = "todo" | "in-progress" | "done";

//=====================================================================
/**
 * 2. CONTRATO EXTERNO (EXTERNAL CONTRACT): DATA TRANSFER OBJECT (DTO)
 *
 * @description
 * Representa la esructura "CRUDA" tal y como nos la entrega la api, es decir, sin ninguna transformación ni validación adicional.
 * Es importante destacar que este tipo de contrato se utiliza exclusivamente para la transferencia de datos entre el cliente y el servidor, y no debe contener lógica de negocio ni métodos adicionales.
 */

export interface TaskDTO {
  userId: number;
  id: number;
  title: string;
  completed: boolean; // La API solo conoce verdadero o falso.
}

//=====================================================================
/**
 * 3. MODELO DE DOMINIO (DOMAIN MODEL)
 *
 * @description
 * Representa la estructura de una tarea tal y como la manejamos dentro de nuestra aplicación, es decir, con las transformaciones y validaciones necesarias para adaptarla a nuestras necesidades.
 * En este caso, hemos transformado el campo "completed" del DTO en un campo "status" de tipo TaskStatus, lo que nos permite manejar los estados de la tarea de una manera más clara y consistente dentro de nuestra aplicación.
 */

export interface Task {
  id: number;
  title: string;
  status: TaskStatus; // Nuestro modelo de dominio solo conoce los estados definidos en TaskStatus.
}
