# Guía Operativa para Claude Code — Proyecto VYFITH

Santiago Smit Teherán Mogollón (21 años, Ingeniería Civil UPB Montería).
Este repositorio es la fuente única de verdad del proyecto web VYFITH. Trabajas en equipo con Antigravity (Gemini).

---

## 🚀 1. Entorno de Desarrollo y Localhost
- **Ruta Oficial de Trabajo:** `C:\Proyectos\VYFITH`
- **Servidor de Desarrollo:** Corre en `http://localhost:3000` (`npm run dev -H 0.0.0.0 -p 3000`).
- **Hot Reload Activo:** Cualquier cambio guardado en `app/` o `components/` se compila y refresca automáticamente en el navegador en vivo.
- **Variables de Entorno:** Ubicadas en `C:\Proyectos\VYFITH\.env.local`.

---

## 🔄 2. Flujo de Trabajo y Sincronización con Gemini
- Tanto Claude como Gemini editan **exclusivamente** los archivos de esta carpeta (`C:\Proyectos\VYFITH`).
- **Repositorio Git:** `https://github.com/teheransmit/VYFITH.git` (rama `main`).
- Antes de comenzar una tarea, ejecuta:
  ```bash
  git pull origin main
  ```
- Al finalizar cambios y verificar que no hay errores de compilación (`npm run build` o inspección en `localhost:3000`), ejecuta:
  ```bash
  git add .
  git commit -m "feat/fix: descripción clara del cambio"
  git push origin main
  ```

---

## 🛡️ 3. Reglas Técnicas
- **Cero Respuestas Falsas / Determínicas:** No enmascarar llamadas a APIs con datos estáticos simulados.
- **Compatibilidad Tailwind / CSS:** El proyecto usa Next.js 15 y Tailwind. Mantener layouts fluidos y responsive (evitar anchos fijos que compriman columnas en móviles).
- **Rutas de Sincronización Móvil:**
  - `/api/sync/health` -> Ingesta de métricas Health Connect.
  - `/api/water` -> Ingesta de hidratación.
  - `/api/nutrition/log` -> Ingesta de comidas y macros.
  - `/api/sync/measurements` -> Medidas y composición corporal.
- **Producción:** Desplegado en Vercel (`https://vyfith.vercel.app`).
