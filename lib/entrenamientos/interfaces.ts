/**
 * Interfaz Unificada (Estándar Interno)
 * Representa una sesión de entrenamiento estandarizada en FitSync AI.
 */

export interface Serie {
  indice: number;
  tipoDeSerie: string;      // ej. "normal", "warmup", "drop"
  pesoLibras: number;
  repeticiones: number;
  rpe: number | null;
  distanciaKm: number | null;
  duracionSegundos: number | null;
}

export interface Ejercicio {
  tituloEjercicio: string;
  notas: string | null;
  idSuperserie: string | null;
  series: Serie[];
}

export interface SesionEntrenamiento {
  titulo: string;
  fechaInicio: Date;
  fechaFin: Date;
  descripcion: string | null;
  ejercicios: Ejercicio[];
}

/**
 * Interfaz principal del Patrón Adaptador para abstraer la fuente de los datos (CSV o API).
 */
export interface AdaptadorEntrenamiento {
  obtenerEntrenamientos(): Promise<SesionEntrenamiento[]>;
}

