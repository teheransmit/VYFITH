import * as fs from 'fs';
import csvParser from 'csv-parser';
import { AdaptadorEntrenamiento, SesionEntrenamiento, Ejercicio, Serie } from './interfaces';

/**
 * Adaptador para leer exportaciones de Hevy en formato CSV.
 * Implementa el Patrón Adaptador para acoplarse al estándar interno SesionEntrenamiento.
 * 
 * Fase 1 - Actual (Exportaciones manuales).
 */
export class AdaptadorCsvHevy implements AdaptadorEntrenamiento {
  private rutaArchivo: string;

  constructor(rutaArchivo: string) {
    this.rutaArchivo = rutaArchivo;
  }

  public async obtenerEntrenamientos(): Promise<SesionEntrenamiento[]> {
    return new Promise((resolver, rechazar) => {
      // Utilizamos un mapa para agrupar filas que pertenecen al mismo entrenamiento
      const sesionesMapa = new Map<string, SesionEntrenamiento>();

      fs.createReadStream(this.rutaArchivo)
        .pipe(csvParser())
        .on('data', (fila: any) => {
          // Generamos una clave única para agrupar las filas (series) que pertenecen 
          // a la misma fecha y hora de inicio, y que tienen el mismo título de rutina
          const claveAgrupacion = `${fila.start_time}_${fila.title}`;

          if (!sesionesMapa.has(claveAgrupacion)) {
            // Inicializar la estructura base de la sesión de entrenamiento
            sesionesMapa.set(claveAgrupacion, {
              titulo: fila.title,
              fechaInicio: new Date(fila.start_time),
              fechaFin: new Date(fila.end_time),
              descripcion: fila.description || null,
              ejercicios: []
            });
          }

          const sesion = sesionesMapa.get(claveAgrupacion)!;

          // Buscar si el ejercicio ya fue registrado previamente en esta sesión
          let ejercicio = sesion.ejercicios.find(e => e.tituloEjercicio === fila.exercise_title);
          
          if (!ejercicio) {
            ejercicio = {
              tituloEjercicio: fila.exercise_title,
              notas: fila.exercise_notes || null,
              idSuperserie: fila.superset_id || null,
              series: []
            };
            sesion.ejercicios.push(ejercicio);
          }

          // Crear y poblar el objeto de la serie individual
          const serie: Serie = {
            indice: parseInt(fila.set_index, 10),
            tipoDeSerie: fila.set_type,
            pesoLibras: parseFloat(fila.weight_lbs) || 0,
            repeticiones: parseInt(fila.reps, 10) || 0,
            rpe: fila.rpe ? parseFloat(fila.rpe) : null,
            distanciaKm: fila.distance_km ? parseFloat(fila.distance_km) : null,
            duracionSegundos: fila.duration_seconds ? parseInt(fila.duration_seconds, 10) : null
          };

          // Agregar la serie al ejercicio correspondiente
          ejercicio.series.push(serie);
        })
        .on('end', () => {
          // Al terminar de leer el CSV, convertimos el mapa de valores en el arreglo estandarizado
          resolver(Array.from(sesionesMapa.values()));
        })
        .on('error', (error) => {
          rechazar(error);
        });
    });
  }
}

