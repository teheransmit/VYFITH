'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  RefreshCw,
  QrCode,
  Shield,
  Activity,
  Heart,
  Code2,
  Copy,
  Check,
  Zap,
  Flame,
  Moon,
  Dumbbell,
  Send,
  MessageSquare,
  Bot,
  ExternalLink,
} from 'lucide-react';
import { SyncSessionState } from '@/lib/healthStore';

export default function GoogleHealthConnector() {
  const [syncState, setSyncState] = useState<SyncSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSimulatingVyfith, setIsSimulatingVyfith] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'prompt' | 'worker' | 'manifest'>('prompt');
  const [copiedCode, setCopiedCode] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch('/api/sync/health');
        const data = await res.json();
        if (isMounted && data.success && data.data) {
          setSyncState(data.data);
        }
      } catch (err) {
        console.error('Error fetching health sync state:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sync/health');
      const data = await res.json();
      if (data.success && data.data) {
        setSyncState(data.data);
      }
    } catch (err) {
      console.error('Error fetching health sync state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simular envío específico desde VYFITH_APP
  const triggerVyfithSimulation = async () => {
    try {
      setIsSimulatingVyfith(true);
      const res = await fetch('/api/sync/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulateVyfith: true }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setSyncState(result.data);
        setNotificationMsg(`¡Datos de VYFITH_APP recibidos! Readiness Score y recomendaciones de Gemini actualizados.`);
        setTimeout(() => setNotificationMsg(null), 5000);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulatingVyfith(false);
    }
  };

  // Recargar datos reales procesados de Google Health & Hevy
  const triggerReloadRealData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sync/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reloadReal: true }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setSyncState(result.data);
        setNotificationMsg('¡Datos reales de Google Health y Hevy sincronizados exitosamente desde disco!');
        setTimeout(() => setNotificationMsg(null), 5000);
      }
    } catch (err) {
      console.error('Error sincronizando datos reales:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Simular worker en segundo plano
  const triggerSimulation = async () => {
    try {
      setIsSimulating(true);
      const res = await fetch('/api/sync/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate: true }),
      });
      const result = await res.json();
      if (result.success && result.data) {
        setSyncState(result.data);
        setNotificationMsg(`¡Deltas sincronizados! Se agregaron nuevas observaciones HL7 FHIR (LOINC 55423-8 y 80404-7).`);
        setTimeout(() => setNotificationMsg(null), 5000);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyPairingToken = () => {
    if (syncState?.pairingToken) {
      navigator.clipboard.writeText(syncState.pairingToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  // Prompt exacto para copiar y pegar en el chat de VYFITH_APP
  const vyfithPromptText = `Actúa como desarrollador Android Senior en Kotlin. Necesito agregar una función de sincronización en esta app (FitSync AI / VYFITH_APP) para enviar las métricas de salud de Room, el análisis de Gemini y el Readiness Score a mi plataforma web en MegaProyecto.

1. ENDPOINT DE DESTINO (HTTPS POST):
URL: https://ais-pre-2ihzxs7iiz7evj5q52apo5-472843269573.us-east1.run.app/api/sync/health
Headers: Content-Type: application/json

2. PAYLOAD JSON A TRANSMITIR:
{
  "source": "VYFITH_APP",
  "deviceId": android.os.Build.MODEL,
  "readinessScore": readinessScore, // Número del 0 al 100 calculado
  "readinessCategory": readinessCategoryText, // "Vitalidad Óptima", etc.
  "geminiAnalysis": {
    "diagnostico": diagnosisFromGemini,
    "recomendacionMuscular": workoutAdviceFromGemini,
    "gruposPriorizar": listOf("Pectoral", "Deltoides"),
    "gruposDescanso": listOf("Piernas")
  },
  "roomMetrics": {
    "steps": dailyStepsFromHealthConnect,
    "deepSleepHours": deepSleepHours,
    "totalSleepHours": totalSleepHours,
    "restingHeartRate": restingHeartRate,
    "spo2": spo2Percentage,
    "caloriesBurned": activeCalories
  },
  "hevyWorkouts": {
    "lastWorkoutName": lastWorkoutName,
    "totalVolumeKg": totalVolumeKg,
    "setsCompleted": totalSetsCompleted,
    "date": workoutDateString
  }
}

3. IMPLEMENTACIÓN EN LA INTERFAZ:
- En la barra superior (TopAppBar) o en el diálogo de Perfil de Usuario, añade una opción o botón:
  "🔗 Sincronizar con MegaProyecto Web"
- Al pulsarlo (o automáticamente al completar el cálculo diario del Readiness Score), ejecuta una corrutina (Dispatchers.IO) usando el cliente OkHttp/Retrofit ya existente en la app para enviar el JSON por POST.
- Muestra un Toast de confirmación: "¡Datos enviados a MegaProyecto Web!".`;

  const copyPromptHandler = () => {
    navigator.clipboard.writeText(vyfithPromptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  const copyCodeContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const workerCodeSnippet = `// HealthSyncWorker.kt (WorkManager + Changes API)
class HealthSyncWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        val client = HealthConnectClient.getOrCreate(applicationContext)
        val token = getStoredChangesToken() ?: requestNewChangesToken(client)
        val changes = client.getChanges(token)
        
        val fhirPayload = JSONArray()
        for (change in changes.changes) {
            if (change is UpsertionChange) {
                when (val record = change.record) {
                    is StepsRecord -> fhirPayload.put(mapStepsToFhir(record)) // LOINC 55423-8
                    is HeartRateRecord -> fhirPayload.put(mapHeartRateToFhir(record)) // LOINC 8867-4
                    is HeartRateVariabilityRmssdRecord -> fhirPayload.put(mapHrvToFhir(record)) // LOINC 80404-7
                }
            }
        }
        if (fhirPayload.length() > 0) sendToBackend(fhirPayload)
        saveChangesToken(changes.nextChangesToken)
        Result.success()
    }
}`;

  const manifestCodeSnippet = `<!-- AndroidManifest.xml (Permisos requeridos por Health Connect) -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.health.READ_STEPS" />
    <uses-permission android:name="android.permission.health.READ_HEART_RATE" />
    <uses-permission android:name="android.permission.health.READ_SLEEP" />
    <uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY" />
</manifest>`;

  const vyfithData = syncState?.vyfithData;
  const readiness = vyfithData?.readinessScore ?? 88;
  const isOptimal = readiness >= 80;
  const isModerate = readiness >= 60 && readiness < 80;

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Puente Activo con Google Health Connect
            </span>
            <span className="text-xs font-mono text-slate-400">VYFITH_APP (FitSync AI) ➔ MegaProyecto</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Sincronización con tu App Móvil (VYFITH_APP)
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Tu app de salud recoge los permisos locales de Health Connect, almacena en Room Database y evalúa con Gemini. Copia el prompt para que esa app envíe sus datos directamente a esta web.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            onClick={triggerReloadRealData}
            disabled={isLoading}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            title="Carga los datos reales procesados desde tu Google Health y Hevy"
          >
            <Activity className="w-4 h-4 text-emerald-200" />
            <span>Sincronizar Google Health & Hevy</span>
          </button>
          <button
            onClick={triggerVyfithSimulation}
            disabled={isSimulatingVyfith}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            title="Simula la llegada de un paquete de datos desde VYFITH_APP"
          >
            <Zap className={`w-4 h-4 ${isSimulatingVyfith ? 'animate-spin' : 'text-amber-300'}`} />
            <span>{isSimulatingVyfith ? 'Procesando...' : 'Simular Envío VYFITH_APP'}</span>
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="cursor-pointer p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refrescar estado del servidor"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alerta de notificación flotante */}
      {notificationMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notificationMsg}</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-600">Sincronizado ahora</span>
        </div>
      )}

      {/* TARJETA DESTACADA: PROMPT PARA EL OTRO CHAT EN AI STUDIO */}
      <div className="my-6 p-6 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white border border-indigo-500/20 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30 text-indigo-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold tracking-wider text-indigo-300">
                Paso 1: Instruir a tu otra app
              </span>
              <h3 className="text-lg font-bold text-white">Prompt Oficial para el chat de VYFITH_APP</h3>
            </div>
          </div>

          <button
            onClick={copyPromptHandler}
            className="cursor-pointer inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors shadow-md shrink-0"
          >
            {copiedPrompt ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
            <span>{copiedPrompt ? '¡Prompt Copiado!' : 'Copiar Prompt para VYFITH_APP'}</span>
          </button>
        </div>

        {/* Instrucciones de 3 pasos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 text-xs">
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Abre el proyecto de tu app <strong>VYFITH_APP</strong> en otra pestaña de Google AI Studio.
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Pega este prompt en el chat de ese proyecto y deja que el asistente modifique el código.
            </p>
          </div>
          <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              En tu teléfono, pulsa el nuevo botón <i>&quot;Sincronizar con MegaProyecto Web&quot;</i> y tus datos llegarán aquí.
            </p>
          </div>
        </div>

        {/* Caja de texto del prompt */}
        <div className="relative mt-2">
          <div className="text-[11px] font-mono text-slate-300 bg-black/40 p-4 rounded-xl border border-white/10 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
            {vyfithPromptText}
          </div>
        </div>
      </div>

      {/* TARJETA EN VIVO: READINESS SCORE & DATOS DE VYFITH_APP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Widget Circular del Readiness Score */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Nivel de Recuperación (Readiness)</span>
          </div>

          <div className="relative flex items-center justify-center my-2">
            <div
              className={`w-32 h-32 rounded-full border-8 flex flex-col items-center justify-center transition-all ${
                isOptimal
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
                  : isModerate
                  ? 'border-amber-500 bg-amber-50/50 text-amber-700'
                  : 'border-rose-500 bg-rose-50/50 text-rose-700'
              }`}
            >
              <span className="text-4xl font-extrabold tracking-tight">{readiness}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">de 100</span>
            </div>
          </div>

          <span
            className={`mt-2 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
              isOptimal
                ? 'bg-emerald-100 text-emerald-800'
                : isModerate
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {vyfithData?.readinessCategory || 'Vitalidad Óptima'}
          </span>

          <span className="text-[11px] text-slate-400 mt-2">
            Calculado por el motor de IA en tu app móvil
          </span>
        </div>

        {/* Tarjeta de Análisis de Gemini (Médico Deportivo) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                <Bot className="w-4 h-4 text-indigo-600" />
                <span>Tarjeta de Análisis de Gemini AI (Médico Deportivo)</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                gemini-3.1-pro-preview
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80 mb-3">
              {vyfithData?.geminiAnalysis.diagnostico ||
                'Recuperación excelente del sistema nervioso central (SNC). Frecuencia cardíaca en reposo baja y sueño profundo óptimo.'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-emerald-50/80 border border-emerald-100 rounded-xl">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  Grupos a Priorizar Hoy
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {vyfithData?.geminiAnalysis.gruposPriorizar.map((g, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-emerald-700 font-semibold rounded-md border border-emerald-200 text-[11px]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-rose-50/80 border border-rose-100 rounded-xl">
                <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1">
                  Grupos en Descanso
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {vyfithData?.geminiAnalysis.gruposDescanso.map((g, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white text-rose-700 font-semibold rounded-md border border-rose-200 text-[11px]">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-400">
            <span>Fuente: <strong className="text-slate-700">FitSync AI (Kotlin + Room)</strong></span>
            <span suppressHydrationWarning>
              Última recepción: {vyfithData?.lastSyncTimestamp ? vyfithData.lastSyncTimestamp.replace('T', ' ').slice(0, 16) : 'Reciente'}
            </span>
          </div>
        </div>
      </div>

      {/* Métricas extraídas de Room Database & Health Connect */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            <span>Pasos Totales</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.steps.toLocaleString() ?? '11,240'}
          </div>
          <div className="text-[10px] text-slate-400">Health Connect</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>FC Reposo</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.restingHeartRate ?? 58} <span className="text-xs font-normal text-slate-500">bpm</span>
          </div>
          <div className="text-[10px] text-emerald-600 font-medium">Óptimo para SNC</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Moon className="w-3.5 h-3.5 text-purple-600" />
            <span>Sueño Profundo</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.deepSleepHours ?? 2.4} <span className="text-xs font-normal text-slate-500">h</span>
          </div>
          <div className="text-[10px] text-slate-400">Total: {vyfithData?.roomMetrics.totalSleepHours ?? 8.1}h</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Activity className="w-3.5 h-3.5 text-sky-500" />
            <span>SpO2</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.spo2 ?? 99}%
          </div>
          <div className="text-[10px] text-slate-400">Oxigenación</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Calorías</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {vyfithData?.roomMetrics.caloriesBurned.toLocaleString() ?? '2,450'}
          </div>
          <div className="text-[10px] text-slate-400">kcal activas</div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-1">
            <Dumbbell className="w-3.5 h-3.5 text-blue-600" />
            <span>Hevy Workouts</span>
          </div>
          <div className="text-lg font-bold text-slate-900 truncate" title={vyfithData?.hevySummary.lastWorkoutName}>
            {vyfithData?.hevySummary.totalVolumeKg.toLocaleString() ?? '14,850'} <span className="text-xs font-normal text-slate-500">kg</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">{vyfithData?.hevySummary.lastWorkoutName || 'Push Day'}</div>
        </div>
      </div>

      {/* Visor de Código & Snippets */}
      <div className="mt-8 bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 text-white">
        <div className="flex flex-wrap items-center justify-between p-4 bg-slate-950 border-b border-slate-800 gap-2">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-slate-200">Recursos de Sincronización</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveCodeTab('prompt')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                activeCodeTab === 'prompt' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Prompt para VYFITH_APP
            </button>
            <button
              onClick={() => setActiveCodeTab('worker')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                activeCodeTab === 'worker' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              HealthSyncWorker.kt
            </button>
            <button
              onClick={() => setActiveCodeTab('manifest')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                activeCodeTab === 'manifest' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              AndroidManifest.xml
            </button>
          </div>

          <button
            onClick={() => {
              const code =
                activeCodeTab === 'prompt'
                  ? vyfithPromptText
                  : activeCodeTab === 'worker'
                  ? workerCodeSnippet
                  : manifestCodeSnippet;
              copyCodeContent(code);
            }}
            className="cursor-pointer text-xs flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? '¡Copiado!' : 'Copiar Contenido'}</span>
          </button>
        </div>

        <div className="p-4 text-xs font-mono overflow-x-auto text-slate-300 bg-slate-900 max-h-72">
          <pre>
            {activeCodeTab === 'prompt' && vyfithPromptText}
            {activeCodeTab === 'worker' && workerCodeSnippet}
            {activeCodeTab === 'manifest' && manifestCodeSnippet}
          </pre>
        </div>

        <div className="p-3 bg-slate-950/80 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>URL pública de ingesta: <code>/api/sync/health</code></span>
          <span className="text-emerald-400">HL7 FHIR R4 + FitSync AI Compatible</span>
        </div>
      </div>

      {/* Lista de Observaciones FHIR Recibidas */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            Últimas Observaciones Biométricas HL7 FHIR (Recibidas por API)
          </h3>
          <span className="text-xs text-slate-400">Total: {syncState?.recentObservations?.length || 0} registros</span>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Tipo / LOINC</th>
                <th className="px-4 py-3 font-semibold">Valor Registrado</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Fecha Efectiva</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {syncState?.recentObservations && syncState.recentObservations.length > 0 ? (
                syncState.recentObservations.slice(0, 6).map((obs) => {
                  const loinc = obs.code?.coding?.[0]?.code || 'N/A';
                  const display = obs.code?.coding?.[0]?.display || 'Métrica';
                  const val = obs.valueQuantity?.value;
                  const unit = obs.valueQuantity?.unit;

                  return (
                    <tr key={obs.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <div className="font-semibold text-slate-800">{display}</div>
                        <div className="text-[10px] font-mono text-slate-400">LOINC {loinc}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                          {typeof val === 'number' ? (val % 1 !== 0 ? val.toFixed(1) : val.toLocaleString()) : val}{' '}
                          <span className="font-normal text-slate-500">{unit}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700">
                          {obs.category || 'Biométrico'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]" suppressHydrationWarning>
                        {obs.effectiveDateTime ? obs.effectiveDateTime.replace('T', ' ').slice(0, 16) : 'Reciente'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> FHIR {obs.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                    No hay observaciones recientes. Pulsa &quot;Simular Envío VYFITH_APP&quot; para generar un lote de prueba.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
