/**
 * Utilidades compartidas para el módulo de entrenamientos.
 */

/**
 * Formatea números como strings estrictamente con comas para separar miles 
 * y punto para decimales. 
 * Requisito para enviarlo a la vista o al prompt de Gemini.
 * 
 * @param numero El valor numérico a formatear
 * @returns El string formateado (ejemplo: "1,250.75")
 */
export function formatearNumeroEstandar(numero: number): string {
  // 'en-US' utiliza nativamente comas para miles y puntos para decimales
  return numero.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

