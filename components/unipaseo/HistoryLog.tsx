'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TripLog, DayOfWeek, StrategyType, RealWalkLog } from '@/lib/unipaseoTypes';
import { 
  History, 
  Plus, 
  Trash2, 
  Award, 
  TrendingUp, 
  Smile, 
  Frown, 
  MapPin,
  Sparkles
} from 'lucide-react';
import Markdown from 'react-markdown';

interface HistoryLogProps {
  logs: TripLog[];
  realLogs?: RealWalkLog[];
  onAddLog: (newLog: Omit<TripLog, 'id'>) => void;
  onClearLogs: () => void;
  onUpdateRealLog?: (logId: string, updates: Partial<RealWalkLog>) => void;
}

export default function HistoryLog({
  logs,
  realLogs = [],
  onAddLog,
  onClearLogs,
  onUpdateRealLog,
}: HistoryLogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const handleAnalyze = async (logId: string) => {
    const log = realLogs.find((l) => l.id === logId);
    if (!log) return;

    try {
      setAnalyzingId(logId);
      const res = await fetch('/api/bio-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              text: `Analiza este paseo GPS real en Montería: distancia total ${log.totalDistanceKm.toFixed(2)} km con eventos ${JSON.stringify(log.events)}. ¿Qué tan eficiente fue la ruta para llegar puntual a la UPB?`,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.reply) {
        if (onUpdateRealLog) {
          onUpdateRealLog(logId, { analysis: data.reply });
        } else {
          log.analysis = data.reply;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingId(null);
    }
  };

  const [newLogDay, setNewLogDay] = useState<DayOfWeek>('lunes');
  const [newLogStrategy, setNewLogStrategy] = useState<StrategyType>('zigzag');
  const [newLogScheduled, setNewLogScheduled] = useState('09:42');
  const [newLogClassTime, setNewLogClassTime] = useState('10:00');
  const [newLogDogsCount, setNewLogDogsCount] = useState(3);
  const [newLogNotes, setNewLogNotes] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const getMinutes = (tStr: string) => {
      const [h, m] = tStr.split(':').map(Number);
      return h * 60 + m;
    };

    const schedMin = getMinutes(newLogScheduled);
    const classMin = getMinutes(newLogClassTime);
    const diff = classMin - schedMin;

    let status: 'early' | 'on_time' | 'late' = 'on_time';
    if (diff >= 15) status = 'early';
    else if (diff < 0) status = 'late';

    onAddLog({
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      day: newLogDay,
      strategy: newLogStrategy,
      scheduledArrival: newLogScheduled,
      targetClassTime: newLogClassTime,
      status,
      dogsWalked: newLogDogsCount,
      notes: newLogNotes || undefined,
    });

    setNewLogNotes('');
    setShowAddForm(false);
  };

  const getStatusBadge = (status: 'early' | 'on_time' | 'late') => {
    switch (status) {
      case 'early':
        return (
          <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 text-[9px] px-2 py-0.5 rounded-full font-black border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            <Smile className="w-2.5 h-2.5 shrink-0" /> CON TIEMPO
          </span>
        );
      case 'on_time':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 text-[9px] px-2 py-0.5 rounded-full font-black border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            <Award className="w-2.5 h-2.5 shrink-0" /> JUSTO
          </span>
        );
      case 'late':
        return (
          <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 text-[9px] px-2 py-0.5 rounded-full font-black border border-rose-200 dark:border-rose-800 flex items-center gap-1">
            <Frown className="w-2.5 h-2.5 shrink-0 animate-bounce" /> TARDE ⚠️
          </span>
        );
    }
  };

  const getStrategyName = (s: StrategyType) => {
    if (s === 'zigzag') return 'Zigzag Activo';
    if (s === 'lineal') return 'Ida y Vuelta Lineal';
    return 'Terminar en Último';
  };

  const totalTrips = logs.length;
  const onTimePercentage = totalTrips
    ? Math.round((logs.filter((l) => l.status !== 'late').length / totalTrips) * 100)
    : 0;
  const averageDogs = totalTrips
    ? (logs.reduce((acc, l) => acc + l.dogsWalked, 0) / totalTrips).toFixed(1)
    : '0';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 uppercase tracking-wide">
          <History className="w-4 h-4 text-emerald-600" /> Historial de Tiempos Realizados
        </h4>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Paseo
          </button>
          {logs.length > 0 && (
            <button
              type="button"
              onClick={onClearLogs}
              title="Borrar todo"
              className="p-1 text-slate-400 hover:text-rose-500 rounded transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Statistics board */}
      {logs.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Paseos Hoy</span>
            <span className="text-sm font-black text-slate-700 dark:text-white">{totalTrips}</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Éxito Puntual</span>
            <span className="text-sm font-black text-slate-700 dark:text-white">{onTimePercentage}%</span>
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase block">Promedio Perros</span>
            <span className="text-sm font-black text-slate-700 dark:text-white">{averageDogs} 🐕</span>
          </div>
        </div>
      )}

      {/* Log add form */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="bg-indigo-50/50 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-3">
          <span className="font-extrabold text-indigo-900 dark:text-indigo-300 text-[10px] block uppercase">Registrar Tiempos de Hoy</span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Día</label>
              <select
                value={newLogDay}
                onChange={(e) => setNewLogDay(e.target.value as DayOfWeek)}
                className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              >
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Perros Paseados</label>
              <input
                type="number"
                min="0"
                max="3"
                value={newLogDogsCount}
                onChange={(e) => setNewLogDogsCount(parseInt(e.target.value) || 0)}
                className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-center text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Llegada UPB</label>
              <input
                type="time"
                required
                value={newLogScheduled}
                onChange={(e) => setNewLogScheduled(e.target.value)}
                className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Hora de Clase</label>
              <input
                type="time"
                required
                value={newLogClassTime}
                onChange={(e) => setNewLogClassTime(e.target.value)}
                className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              />
            </div>
            <div className="col-span-2">
              <label className="text-[9px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Estrategia Aplicada</label>
              <select
                value={newLogStrategy}
                onChange={(e) => setNewLogStrategy(e.target.value as StrategyType)}
                className="w-full p-1.5 border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
              >
                <option value="zigzag">Zigzag Activo</option>
                <option value="lineal">Ida y Vuelta Lineal</option>
                <option value="terminar_m">Terminar en el último (Bus)</option>
              </select>
            </div>
            <div className="col-span-2">
              <input
                type="text"
                placeholder="Anotaciones (ej. ¡Me demoré en la parada!)"
                value={newLogNotes}
                onChange={(e) => setNewLogNotes(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer hover:bg-indigo-700 transition-colors"
            >
              Guardar Log
            </button>
          </div>
        </form>
      )}

      {/* History log rows list */}
      {logs.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col items-center">
          <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-1.5" />
          <p className="text-[11px] font-bold text-slate-400">No hay registros cargados aún.</p>
          <p className="text-[9px] text-slate-400/80 max-w-[200px] mt-0.5 leading-normal">
            Anota tus tiempos reales al llegar a clase para medir si las estrategias te sirven.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                  {log.date} — {log.day}
                </span>
                {getStatusBadge(log.status)}
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                <span>
                  Strat: <b>{getStrategyName(log.strategy)}</b> • {log.dogsWalked} Perros 🐕
                </span>
                <span>
                  Llegada: <b>{log.scheduledArrival}</b> (Entrada: {log.targetClassTime})
                </span>
              </div>
              {log.notes && (
                <p className="text-[10px] bg-indigo-50/40 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold italic mt-1 px-2 py-0.5 rounded leading-relaxed border-l-2 border-indigo-400">
                  💬 {log.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Real Walks GPS logs */}
      {realLogs.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs flex items-center gap-1.5 uppercase tracking-wide mb-3">
            <MapPin className="w-4 h-4 text-indigo-600" /> Tiempos Reales de GPS
          </h4>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {realLogs.map((log) => {
              const dur = log.endTime ? Math.round((log.endTime - log.startTime) / 60000) : 0;
              return (
                <div key={log.id} className="p-3 border border-slate-100 dark:border-slate-800 rounded-xl flex flex-col gap-1 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 capitalize">
                      {log.date} — {log.totalDistanceKm.toFixed(2)} km
                    </span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                      {dur} mins
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {log.events.map((ev, i) => (
                      <span key={i} className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-md font-medium">
                        {ev.type.replace('pick_', '')} {ev.timeStr.slice(0, 5)}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => handleAnalyze(log.id)}
                    disabled={analyzingId === log.id}
                    className="mt-2 w-full py-1.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    {analyzingId === log.id ? (
                      <span className="animate-pulse">Analizando con Gemini...</span>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" /> Analizar tiempos con AI
                      </>
                    )}
                  </button>

                  {log.analysis && (
                    <div className="mt-2 p-3 bg-indigo-900 text-indigo-50 text-[10px] rounded-xl leading-relaxed">
                      <strong className="text-indigo-200 mb-1 block uppercase tracking-wider text-[9px]">💡 Gemini Insights</strong>
                      <div className="markdown-body space-y-1.5 [&>p]:mb-1 [&>ul]:list-disc [&>ul]:pl-3 [&>ol]:list-decimal [&>ol]:pl-3 [&>strong]:font-bold [&>strong]:text-indigo-100">
                        <Markdown>{log.analysis}</Markdown>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
