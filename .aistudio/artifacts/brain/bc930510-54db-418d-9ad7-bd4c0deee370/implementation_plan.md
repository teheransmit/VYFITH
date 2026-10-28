# Plan de Implementación: Solución de Sincronización Móvil y Módulo Financiero (Medellín 2026)

Este plan aborda las dos necesidades prioritarias:
1. **Solución definitiva al error 404 en la app móvil y confirmación visual inmediata:** Explicación exacta de qué cambiar en la app Kotlin (el código cliente en tu teléfono estaba apuntando a una URL local o inexistente como `api.megaproyecto.com`), entrega del snippet Kotlin listo para pegar, y adición de un **Monitor de Recepción en Tiempo Real** en la web que muestra al instante cuándo llegó el último paquete, qué dispositivo lo mandó y los datos recibidos.
2. **Nuevo Módulo Financiero Integral en una Pestaña Dedicada:** Implementación del sistema financiero con el simulador diario de movimientos, control de cuentas (Nu Cajita Medayork al 9.30% E.A., Nequi, Efectivo), cuentas por cobrar (Laura, Sienna), aportes familiares (Papá, Mamá), y presupuesto detallado del viaje a Medellín (8 al 12 de octubre de 2026) con la respuesta obligatoria de 4 bloques.

---

## 1. Diagnóstico del Error HTTP 404 en la App Móvil

### ¿Por qué salía el error en tu celular?
En tu teléfono celular, la app de salud (`HealthSyncWorker.kt` o `MegaProyectoSyncClient.kt`) tenía configurada internamente una URL por defecto (como `https://api.megaproyecto.com/ingest/health` o una IP local). En un dispositivo físico, esa dirección no existe en internet o apunta al propio teléfono, devolviendo un error 404.

### Solución en la App Móvil:
Debes actualizar la URL base en el código de tu app de salud para que apunte a la URL pública y segura de tu servidor en la nube:
```kotlin
// URL real de tu backend MegaProyecto en Google Cloud Run:
const val MEGA_PROYECTO_ENDPOINT = "https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health"
```

---

## 2. Componente de Confirmación en la Página Web: "Monitor de Sincronización en Vivo"

Para que nunca tengas duda de si los datos llegaron o no:
- **Indicador de Conexión en Vivo:** Señal visual con pulso verde (`Online / Sincronizado hace X segundos`).
- **Historial de Paquetes Recibidos:** Registro detallado con marca de tiempo, modelo de celular (ej. *Pixel 8 Pro / Galaxy*), número de observaciones procesadas y categoría.
- **Visualizador de Carga Recibida (Inspector JSON):** Permite desplegar el contenido exacto que mandó el teléfono (pasos, sueño, FC, HRV, Readiness Score de VYFITH_APP).
- **Banner de Alerta Sonora / Visual:** Notificación emergente al recibir una sincronización exitosa sin necesidad de recargar la página.

---

## 3. Módulo Financiero y Planificador de Viaje a Medellín (8 - 12 Octubre 2026)

Crearemos una nueva sección y pestaña principal en la aplicación con:

### A. Parámetros e Ingresos Fijos y Variables:
- **Ingreso Fijo Pasivo:** Aporte de transporte del papá de **$35.000 COP semanales** (100% ahorro libre por usar la tarjeta de su hermano).
- **Ingresos por Paseos Caninos:**
  - *Frida:* **$5.850 COP netos** (tarifa $9.000 COP menos comisión del 35% de Laura).
  - *Molly:* **$5.000 COP netos**.
  - *Sienna:* **$9.000 COP directos**.
- **Ingresos por Rappi:** Turnos de fin de semana en moto con liquidación al 50% con el compañero.
- **Gastos Fijos Mensuales:** Spotify (-$5.100), Crunchyroll (-$5.100), Motilada (-$12.000).

### B. Estado Financiero al Corte (26 Sep 2026):
- **Cuentas Activas:**
  - Efectivo: **$20.000 COP**
  - Cuenta Nu (Cajita Medayork al 9.30% E.A.): **$110.000 COP**
  - Nequi: **$0 COP**
  - *Total Líquido:* **$130.000 COP**
- **Cuentas por Cobrar (Activos en calle):** **$123.050 COP** (Laura: $78.050 COP por paseos | Sienna: $45.000 COP).
- **Aportes Familiares Pendientes:** **$260.000 COP** (Papá: $210.000 COP | Mamá: $50.000 COP).
- **Deudas Estructurales:** $0 COP (Préstamo de vuelos 100% liquidado).

### C. Presupuesto Desglosado del Viaje a Medellín ($420.000 COP Restante):
1. Alojamiento: **$0 COP** (Airbnb liquidado; tío cubre 10-12 oct).
2. Bus Aeropuerto (Combuses MDE - Nutibara ida y vuelta): **-$40.000 COP**.
3. Transporte local (Tarjeta Cívica Metro/Metrocable): **-$35.000 COP**.
4. Alimentación (5 días): **-$225.000 COP**.
5. Actividades y salidas: **-$70.000 COP**.
6. Reserva de imprevistos: **-$50.000 COP**.

### D. Simulador Diario con Formato Estricto de 4 Bloques:
Un simulador interactivo donde Santiago puede registrar movimientos rápidos (ej. *"Hice 2 paseos de Frida y 1 de Molly"*, *"Mi papá me dio los $35.000"*, *"Gasté $15.000 en almuerzo"*), generando automáticamente:
1. **BALANCE EN TABLA:** Cuentas líquidas, cuentas por cobrar, aportes pendientes y excedente líquido real.
2. **PRESUPUESTO DESGLOSADO DEL VIAJE:** Categorías, costo restante y saldo a favor para lujos.
3. **PROYECCIÓN Y DIAGNÓSTICO:** Proyección al 8 de octubre, estado **BIEN 🟢** o **MAL 🔴**, y 2 recomendaciones tácticas sobre cobros o turnos de Rappi.
4. **CIERRE:** Pregunta corta de confirmación de finanzas diarias.

---

## 4. Archivos a Modificar y Crear

1. `components/FinanceSection.tsx`: Reemplazar por el gestor financiero completo con pestañas de *Resumen Financiero*, *Presupuesto Medellín 2026*, *Simulador Diario de 4 Bloques* y *Cajita Medayork Nu (9.30% E.A.)*.
2. `lib/financeStore.ts`: Modelos de datos de cuentas, pasajes, perros, Rappi, cobros y presupuesto Medellín.
3. `components/GoogleHealthConnector.tsx`: Añadir el panel de monitoreo en tiempo real, snippet Kotlin descargable/copiable con un clic y visor visual de confirmación de datos.
4. `android/app/src/main/java/com/megaproyecto/health/HealthSyncWorker.kt`: Actualizar con la URL canónica del entorno y manejo de reintentos.

---

## 5. Verificación
1. Validar la respuesta de la API `/api/sync/health` con curl y comprobar que el estado se actualiza en el frontend.
2. Comprobar que el simulador financiero calcula al peso los ingresos de Frida ($5.850 netos), Molly ($5.000) y pasajes ($35.000 libres).
3. Compilar con `compile_applet` y validar con `lint_applet`.
