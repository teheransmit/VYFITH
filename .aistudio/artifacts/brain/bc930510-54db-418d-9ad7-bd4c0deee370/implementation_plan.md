# Plan de Integración: Prompt y Modificaciones Exactas para VYFITH_APP

¡Sí, exactamente! En el chat de tu **app de salud (VYFITH_APP)** debes darle una instrucción (prompt) para que su IA agregue el conector hacia esta página web.

---

## 1. ¿Qué se debe modificar en tu app de salud (VYFITH_APP)?

La IA de tu app de salud modificará únicamente 3 elementos:

1. **Un cliente HTTP / Retrofit nuevo (`MegaProyectoSyncClient.kt`):**
   Añade la llamada HTTPS `POST` apuntando a la dirección web de este proyecto:  
   `https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health`

2. **Extracción y empaquetado de datos desde Room Database y Gemini:**
   Toma los valores del día que ya existen en su base de datos:
   - `readinessScore` (0 a 100) y categoría ("Vitalidad Óptima", etc.).
   - `geminiAnalysis`: Diagnóstico del médico deportivo y recomendación muscular.
   - `roomMetrics`: Pasos, sueño total, FC reposo, SpO2, calorías.
   - `hevyWorkouts`: Resumen de entrenamientos levantados.

3. **Disparador en la UI:**
   Añade un botón en la barra superior o en la pantalla principal que diga:  
   **"🔗 Sincronizar con MegaProyecto Web"** (y opcionalmente sincronización automática al calcular el score).

---

## 2. El Prompt Exacto para el Chat de tu App de Salud

Este es el texto exacto que te dejaremos listo con un botón de **Copiar** en tu panel web para que solo tengas que pegarlo en el chat de tu app de salud:

```text
Por favor, agrega una función de sincronización externa con mi plataforma central (MegaProyecto).
Necesito lo siguiente:
1. Crea un cliente HTTP (usando el OkHttp/Retrofit que ya tenemos) que haga un POST en formato JSON a esta URL pública:
   https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health

2. El JSON debe contener el resumen del día actual:
   {
     "source": "VYFITH_APP",
     "readinessScore": <score del 0 al 100>,
     "readinessCategory": "<categoria>",
     "geminiAnalysis": {
       "conclusion": "<conclusion del estado de fatiga/descanso>",
       "recommendation": "<grupos musculares a entrenar o descansar>"
     },
     "roomMetrics": {
       "steps": <pasos del dia>,
       "sleepHours": <horas de sueno>,
       "restingHeartRate": <fc reposo>,
       "spo2": <porcentaje>,
       "activeCalories": <calorias quemadas>
     },
     "hevyWorkouts": <resumen o lista de entrenamientos de Hevy>
   }

3. Añade un botón en la barra superior o en la tarjeta de recuperación que diga '🔗 Sincronizar con MegaProyecto Web' con indicador visual de éxito/error al enviar los datos.
```

---

## 3. ¿Qué modificaremos en este proyecto (MegaProyecto)?

1. **Endpoint Receptor (`/api/sync/health/route.ts`):**
   Recepción de este JSON exacto enviado por VYFITH_APP, actualizando el estado global del sistema.

2. **Tarjeta Interactiva en el Dashboard:**
   - Botón directo **"Copiar Prompt para VYFITH_APP"**.
   - Visualizador en vivo del **Readiness Score circular (0-100)** y las recomendaciones del médico deportivo de Gemini.
   - Botón **"Simular Envío de VYFITH_APP"** para probar la visualización de inmediato.

---

## 4. Verificación
1. Validar que la URL pública sea accesible y responda con confirmación HTTP 200 al recibir el JSON de VYFITH_APP.
2. Confirmar que el Readiness Score y las conclusiones de Gemini se rendericen con diseño limpio en el Dashboard.
3. Ejecutar `lint_applet` y `compile_applet`.
