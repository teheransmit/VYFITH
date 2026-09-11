import { AdaptadorEntrenamiento, SesionEntrenamiento } from './interfaces';

/**
 * Adaptador (Plantilla/Stub) para consumir la API oficial de Hevy.
 * Implementa la interfaz principal "AdaptadorEntrenamiento".
 * 
 * Fase 2 - Futuro (Transición a Hevy PRO).
 */
export class AdaptadorApiHevy implements AdaptadorEntrenamiento {
  private llaveApi: string;

  constructor(llaveApi: string) {
    this.llaveApi = llaveApi;
  }

  public async obtenerEntrenamientos(): Promise<SesionEntrenamiento[]> {
    // TODO: Implementar fetch a https://api.hevyapp.com/ usando la API Key cuando se active la suscripción PRO.
    
    /* 
     * Ejemplo Ilustrativo del código futuro:
     *
     * const respuesta = await fetch('https://api.hevyapp.com/v1/workouts', {
     *   method: 'GET',
     *   headers: { 
     *     'Authorization': `Bearer ${this.llaveApi}`,
     *     'Content-Type': 'application/json'
     *   }
     * });
     *
     * if (!respuesta.ok) {
     *   throw new Error(`Error HTTP de Hevy API: ${respuesta.status}`);
     * }
     *
     * const datosCrudosApi = await respuesta.json();
     * return this.mapearRespuestaAInterfazUnificada(datosCrudosApi);
     */

    console.warn("Llamada a AdaptadorApiHevy no implementada todavía. Para usar ahora, invoca AdaptadorCsvHevy.");
    
    // Retorna arreglo vacío temporalmente hasta su implementación real.
    return Promise.resolve([]);
  }
}

