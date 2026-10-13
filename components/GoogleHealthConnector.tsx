'use client';

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RefreshCw,
  Activity,
  Heart,
  Flame,
  Moon,
  Dumbbell,
  Bot,
} from 'lucide-react';
import { SyncSessionState } from '@/lib/healthStore';

export default function GoogleHealthConnector() {
  const [syncState, setSyncState] = useState<SyncSessionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
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

  const copyPairingToken = () => {
    if (syncState?.pairingToken) {
      navigator.clipboard.writeText(syncState.pairingToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const vyfithData = syncState?.vyfithData;
  const readiness = vyfithData?.readinessScore ?? 93;
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
            Salud Biométrica & Conexión Google Health
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Métricas biométricas consolidadas de <strong>Google Health Connect</strong> y <strong>Health Sync</strong> (Google Pixel 8 Pro). Monitoreo continuo de recuperación biológica y fatiga neuromuscular.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          <button
            onClick={triggerReloadRealData}
            disabled={isLoading}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            title="Sincroniza y recarga los datos reales extraídos de Google Health y Hevy"
          >
            <Activity className="w-4 h-4 text-emerald-200" />
            <span>Sincronizar Google Health & Hevy (Datos Reales)</span>
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
          <span className="font-mono text-[10px] text-emerald-600">Actualizado</span>
        </div>
      )}

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
