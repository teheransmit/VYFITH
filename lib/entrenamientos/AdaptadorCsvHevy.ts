import * as fs from 'fs';
import { AdaptadorEntrenamiento, SesionEntrenamiento, Serie } from './interfaces';

/**
 * Función auxiliar para parsear líneas de CSV respetando comillas.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

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
      try {
        if (!fs.existsSync(this.rutaArchivo)) {
          resolver([]);
          return;
        }

        const contenido = fs.readFileSync(this.rutaArchivo, 'utf8');
        const lineas = contenido.split(/\r?\n/).filter(l => l.trim().length > 0);

        if (lineas.length < 2) {
          resolver([]);
          return;
        }

        const encabezados = parseCsvLine(lineas[0]);
        const sesionesMapa = new Map<string, SesionEntrenamiento>();

        for (let i = 1; i < lineas.length; i++) {
          const valores = parseCsvLine(lineas[i]);
          const fila: Record<string, string> = {};
          encabezados.forEach((encabezado, idx) => {
            fila[encabezado] = valores[idx] || '';
          });

          if (!fila.start_time || !fila.title) continue;

          const claveAgrupacion = `${fila.start_time}_${fila.title}`;

          if (!sesionesMapa.has(claveAgrupacion)) {
            sesionesMapa.set(claveAgrupacion, {
              titulo: fila.title,
              fechaInicio: new Date(fila.start_time),
              fechaFin: fila.end_time ? new Date(fila.end_time) : new Date(fila.start_time),
              descripcion: fila.description || null,
              ejercicios: []
            });
          }

          const sesion = sesionesMapa.get(claveAgrupacion)!;

          let ejercicio = sesion.ejercicios.find(e => e.tituloEjercicio === fila.exercise_title);
          
          if (!ejercicio) {
            ejercicio = {
              tituloEjercicio: fila.exercise_title || 'Ejercicio General',
              notas: fila.exercise_notes || null,
              idSuperserie: fila.superset_id || null,
              series: []
            };
            sesion.ejercicios.push(ejercicio);
          }

          const serie: Serie = {
            indice: parseInt(fila.set_index, 10) || 1,
            tipoDeSerie: fila.set_type || 'normal',
            pesoLibras: parseFloat(fila.weight_lbs) || 0,
            repeticiones: parseInt(fila.reps, 10) || 0,
            rpe: fila.rpe ? parseFloat(fila.rpe) : null,
            distanciaKm: fila.distance_km ? parseFloat(fila.distance_km) : null,
            duracionSegundos: fila.duration_seconds ? parseInt(fila.duration_seconds, 10) : null
          };

          ejercicio.series.push(serie);
        }

        resolver(Array.from(sesionesMapa.values()));
      } catch (error) {
        rechazar(error);
      }
    });
  }
}
