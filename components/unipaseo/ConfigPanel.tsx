'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RouteSettings, StrategyType, TransportType } from '@/lib/unipaseoTypes';
import { 
  SlidersHorizontal, 
  Shuffle, 
  AlertCircle, 
  CloudLightning, 
  Activity, 
  Wind, 
  Bike, 
  Dog, 
} from 'lucide-react';

interface ConfigPanelProps {
  settings: RouteSettings;
  onChangeSettings: (newSettings: RouteSettings) => void;
  isThreeDogs?: boolean;
  onOpenDogManager?: () => void;
}

export default function ConfigPanel({
  settings,
  onChangeSettings,
  isThreeDogs,
  onOpenDogManager,
}: ConfigPanelProps) {
  const updateSetting = <K extends keyof RouteSettings>(key: K, value: RouteSettings[K]) => {
    onChangeSettings({
      ...settings,
      [key]: value,
    });
  };

  const handleShuffleOrder = () => {
    const sf: ('S' | 'F')[] = ['S', 'F'];
    if (Math.random() < 0.5) sf.reverse();
    updateSetting('pickupOrder', sf);
  };

  const handleOrderChange = (index: number, value: 'S' | 'F') => {
    const newOrder = [...settings.pickupOrder];
    const prevVal = newOrder[index];
    const existingIndex = newOrder.indexOf(value);
    if (existingIndex !== -1) {
      newOrder[existingIndex] = prevVal;
    }
    newOrder[index] = value;
    updateSetting('pickupOrder', newOrder as ('S' | 'F')[]);
  };

  const hasDuplicateInOrder = () => {
    const activeOrder = settings.pickupOrder.slice(0, 2);
    return new Set(activeOrder).size !== activeOrder.length;
  };

  return (
    <div className="space-y-5">
      {/* 1. Routines settings header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5 uppercase tracking-wide">
          <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Ajustes de Rutina
        </h3>
        <button
          type="button"
          onClick={handleShuffleOrder}
          className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5" /> Aleatorio
        </button>
      </div>

      {/* 2. Start parameters */}
      <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
        <div>
          <label className="font-extrabold text-slate-500 dark:text-slate-400 text-[9px] uppercase tracking-wider block mb-1">Hora Salida Casa</label>
          <input
            type="time"
            value={settings.startTime}
            onChange={(e) => updateSetting('startTime', e.target.value)}
            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-white bg-white dark:bg-slate-900 shadow-xs focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="font-extrabold text-slate-500 dark:text-slate-400 text-[9px] uppercase tracking-wider block mb-1">Origen de Partida</label>
          <select
            value={settings.startLocation}
            onChange={(e) => updateSetting('startLocation', e.target.value as 'centro' | 'abuela')}
            className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 shadow-xs"
          >
            <option value="casa">🏡 Mi Casa (8.7536, -75.8743)</option>
            <option value="centro">🏢 Casa Centro</option>
            <option value="abuela">👵 Casa Abuela</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="font-extrabold text-slate-500 dark:text-slate-400 text-[9px] uppercase tracking-wider block mb-1">Traslado a 1ra Parada (Santiago va en Bicicleta)</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => updateSetting('firstLegTransport', 'bici')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                settings.firstLegTransport === 'bici'
                  ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-700 text-blue-800 dark:text-blue-300 ring-2 ring-blue-400/20'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              <Bike className="w-3.5 h-3.5" /> Bici (15 km/h)
            </button>
            <button
              type="button"
              onClick={() => updateSetting('firstLegTransport', 'pie')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                settings.firstLegTransport === 'pie'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              🚶‍♂️ A Pie
            </button>
            <button
              type="button"
              onClick={() => updateSetting('firstLegTransport', 'moto')}
              className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                settings.firstLegTransport === 'moto'
                  ? 'bg-violet-50 dark:bg-violet-950/60 border-violet-300 dark:border-violet-700 text-violet-800 dark:text-violet-300'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
              }`}
            >
              🏍️ Moto
            </button>
          </div>
        </div>
      </div>

      {/* 3. Pick order list & individual goal timers */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase block">
            Orden de Recogida y Tiempo Objetivo
          </span>
          {onOpenDogManager && (
            <button
              type="button"
              onClick={onOpenDogManager}
              className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
            >
              <Dog className="w-3.5 h-3.5" /> Administrar Perros (+ / -)
            </button>
          )}
        </div>

        {/* 1st position */}
        <div className="flex items-center gap-2 bg-orange-50/70 dark:bg-orange-950/30 p-2.5 rounded-2xl border border-orange-200/50 dark:border-orange-900/40">
          <span className="font-black text-orange-600 dark:text-orange-400 text-xs shrink-0 w-6">1º</span>
          <select
            value={settings.pickupOrder[0]}
            onChange={(e) => handleOrderChange(0, e.target.value as 'S' | 'F')}
            className="flex-1 px-2 py-1.5 border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-white"
          >
            <option value="S">Sienna (Palmanova)</option>
            <option value="F">Frida (Castellana 101)</option>
          </select>
          <div className="flex items-center gap-1.5 w-24 shrink-0">
            <input
              type="number"
              min="5"
              max="120"
              value={settings.pickupOrder[0] === 'S' ? settings.goalSienna : settings.goalFrida}
              onChange={(e) => {
                const id = settings.pickupOrder[0];
                const v = parseInt(e.target.value) || 30;
                if (id === 'S') updateSetting('goalSienna', v);
                else updateSetting('goalFrida', v);
              }}
              className="w-full px-1.5 py-1 border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-center font-extrabold text-orange-700 dark:text-orange-400"
            />
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">m</span>
          </div>
        </div>

        {/* 2nd position */}
        <div className="flex items-center gap-2 bg-purple-50/70 dark:bg-purple-950/30 p-2.5 rounded-2xl border border-purple-200/50 dark:border-purple-900/40">
          <span className="font-black text-purple-600 dark:text-purple-400 text-xs shrink-0 w-6">2º</span>
          <select
            value={settings.pickupOrder[1]}
            onChange={(e) => handleOrderChange(1, e.target.value as 'S' | 'F')}
            className="flex-1 px-2 py-1.5 border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 rounded-xl text-xs font-bold text-slate-700 dark:text-white"
          >
            <option value="F">Frida (Castellana 101)</option>
            <option value="S">Sienna (Palmanova)</option>
          </select>
          <div className="flex items-center gap-1.5 w-24 shrink-0">
            <input
              type="number"
              min="5"
              max="120"
              value={settings.pickupOrder[1] === 'S' ? settings.goalSienna : settings.goalFrida}
              onChange={(e) => {
                const id = settings.pickupOrder[1];
                const v = parseInt(e.target.value) || 30;
                if (id === 'S') updateSetting('goalSienna', v);
                else updateSetting('goalFrida', v);
              }}
              className="w-full px-1.5 py-1 border border-purple-200 dark:border-purple-800 rounded-lg bg-white dark:bg-slate-900 text-xs text-center font-extrabold text-purple-700 dark:text-purple-400"
            />
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">m</span>
          </div>
        </div>

        {hasDuplicateInOrder() && (
          <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 leading-normal">
            <AlertCircle className="w-3.5 h-3.5" /> No debes duplicar perros en el orden. Modifica las opciones.
          </p>
        )}
      </div>

      {/* 4. Speed parameters */}
      <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
        <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase block mb-1">
          Velocidades Base (Km/h)
        </span>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-1">🚶‍♂️ Caminando Solo</label>
            <input
              type="number"
              step="0.1"
              min="2"
              max="10"
              value={settings.walkSpeedSolo}
              onChange={(e) => updateSetting('walkSpeedSolo', parseFloat(e.target.value) || 5.5)}
              className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-center font-bold text-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mb-1">🐕 Con Manada</label>
            <input
              type="number"
              step="0.05"
              min="2"
              max="8"
              value={settings.walkSpeedPack}
              onChange={(e) => updateSetting('walkSpeedPack', parseFloat(e.target.value) || 4.26)}
              className="w-full px-2 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs text-center font-bold text-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* 5. What if scenarios - simulation factor */}
      <div className="space-y-2">
        <span className="font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase block mb-1">
          Escenarios Climáticos & Tránsito (What-If)
        </span>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => updateSetting('scenario', 'normal')}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
              settings.scenario === 'normal'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Wind className="w-4 h-4 text-emerald-500" />
            Normal
          </button>
          
          <button
            type="button"
            onClick={() => updateSetting('scenario', 'lluvia')}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
              settings.scenario === 'lluvia'
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <CloudLightning className="w-4 h-4 text-blue-500 animate-pulse" />
            Lluvia (-20% Vel)
          </button>

          <button
            type="button"
            onClick={() => updateSetting('scenario', 'trafico')}
            className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
              settings.scenario === 'trafico'
                ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 shadow-xs'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-4 h-4 text-rose-500" />
            Retraso (+12m)
          </button>
        </div>
      </div>
    </div>
  );
}
