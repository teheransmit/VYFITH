# MegaProyecto - Puente Móvil Google Health Connect (Android)

Este directorio contiene la aplicación nativa para Android en **Kotlin** que lee los datos biométricos de **Google Health Connect** y los sincroniza de forma continua con la plataforma web.

---

## 🏗️ ¿Cómo Funciona la Sincronización?

1. **Privacidad de Health Connect:**
   Health Connect almacena los pasos, frecuencia cardíaca, sueño y variabilidad de frecuencia cardíaca (HRV) localmente en tu teléfono con encriptación a nivel de hardware. No existe una API en la nube para consultarlos directamente desde un navegador web.

2. **WorkManager en Segundo Plano:**
   Esta app Android ejecuta `HealthSyncWorker` periódicamente (cada 15 minutos) incluso cuando la pantalla está apagada o la aplicación está cerrada.

3. **Changes API (Deltas Eficientes):**
   Utiliza `ChangesToken` de Health Connect para solicitar únicamente los registros nuevos (`UpsertionChange`) o eliminados (`DeletionChange`) desde la última ejecución, ahorrando batería y datos móviles.

4. **Estándar HL7 FHIR R4:**
   Antes de transmitir por HTTPS al backend `/api/sync/health`, cada métrica se formatea como un recurso `Observation` con códigos clínicos internacionales LOINC:
   - **Pasos:** LOINC `55423-8`
   - **Variabilidad de Frecuencia Cardíaca (HRV):** LOINC `80404-7`
   - **Frecuencia Cardíaca en Reposo:** LOINC `8867-4`
   - **Sueño y Descanso:** LOINC `93832-4`

---

## 🚀 Pasos para Probar en tu Teléfono

### Requisitos:
- Android 9.0 (API 28) o superior. En Android 14+, Health Connect viene integrado en los ajustes del sistema. En Android 9-13, instala la app oficial **Health Connect** desde Google Play Store.
- Android Studio Iguana / Jellyfish o superior.

### Instalación:
1. Abre **Android Studio**.
2. Selecciona **Open** y elige la carpeta `/android` de este proyecto.
3. Conecta tu teléfono Android por USB (con Depuración USB activada) o un emulador con Google Play.
4. Haz clic en **Run 'app'** (`Shift + F10`).
5. En la pantalla de la app, pulsa:
   - **1. Conceder Permisos Health Connect:** Se abrirá el selector del sistema de Google para autorizar lectura de Pasos, Frecuencia Cardíaca, Sueño y HRV.
   - **2. Sincronizar Ahora:** Ejecutará una primera extracción manual de deltas y los enviará a tu web.
6. Automáticamente `WorkManager` quedará registrado para sincronizaciones periódicas cada 15 minutos en segundo plano.

### Conectar con la página local

La aplicación Android debe apuntar al mismo servidor que está mostrando la página:

```text
http://192.168.1.8:3000/api/sync/health
```

El teléfono y el PC deben estar en la misma red Wi-Fi. Si la app conserva una URL
anterior de Cloud Run, abre la tarjeta **Endpoint del Servidor** en la app, reemplázala
por la URL anterior y pulsa **Guardar URL de Destino**. Después:

1. Confirma que `npm run dev` está activo en el PC.
2. Permite el puerto TCP 3000 en el Firewall de Windows si el teléfono no conecta.
3. Pulsa **Verificar Extracción en Health Connect** y confirma que hay valores reales.
4. Pulsa **Sincronizar y Verificar Ahora**.
5. Comprueba que el estado indique HTTP `200` y que la página web cambie su hora de última recepción.

La URL de Cloud Run que estaba configurada anteriormente devuelve `404` y no es el
receptor de la instancia local. Para producción se necesitaría desplegar esta misma
ruta y configurar esa URL explícitamente en la app.
