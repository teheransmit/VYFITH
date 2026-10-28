'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Heart,
  Dumbbell,
  Clock,
  Sparkles,
  Layers,
  Calendar,
  Flame,
  TrendingUp,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import GoogleHealthConnector from './GoogleHealthConnector';
import UnifiedGymHevySection from './UnifiedGymHevySection';
import MiFitnessHealthSuite from './MiFitnessHealthSuite';
import { getUpbGymLiveStatus, GymLiveStatus } from '@/lib/upbGymStore';

export default function UnifiedHealthFitnessSection() {
  const [activeSubView, setActiveSubView] = useState<'combined' | 'biometrics' | 'mifitness' | 'gym' | 'hevy'>('combined');
  const [liveGymStatus, setLiveGymStatus] = useState<GymLiveStatus | null>(null);

  useEffect(() => {
    setLiveGymStatus(getUpbGymLiveStatus());
    const timer = setInterval(() => {
      setLiveGymStatus(getUpbGymLiveStatus());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="unified-health-fitness-section" className="space-y-6 animate-fadeIn">
      {/* 1. HERO INTEGRADO & SELECTOR DE ENFOQUE */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-rose-950/80 to-slate-900 border border-rose-900/40 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-400/30">
              <Activity className="w-3.5 h-3.5 text-rose-400" />
              <span>VYFITH • Ecosistema Integral de Salud, Biometría & Fitness</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Salud Biométrica, Gimnasio UPB & Hevy
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Sinergia en tiempo real entre la recuperación neuromuscular (<strong>Google Health Connect</strong> / Vivo Y20 V2027),
              el estado de apertura del <strong>Gimnasio UPB Montería</strong> y la sobrecarga progresiva de <strong>Hevy Workouts</strong>.
            </p>

            {/* Badges Rápidos de Ecosistema */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Vivo Y20 (V2027) • LAN 192.168.1.8</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Membresía Pagada (27/Oct) • 4:00 p.m.</span>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-rose-500/30 text-rose-300 flex items-center gap-1.5 font-mono">
                <Clock className="w-3.5 h-3.5 text-rose-400" />
                <span>Gym UPB:</span>
                <strong className={liveGymStatus?.isOpenNow ? 'text-emerald-400' : 'text-rose-400'}>
                  {liveGymStatus?.isOpenNow ? 'ABIERTO AHORA' : 'CERRADO'}
                </strong>
              </span>

              <span className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5 font-mono">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                <span>14.280 kg / sem • RPE 8.4</span>
              </span>
            </div>
          </div>

          {/* Sub-Selector de Vistas */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-rose-500/30 p-2 shrink-0 shadow-lg flex flex-col sm:flex-row items-center gap-1.5 self-start lg:self-center">
            <button
              onClick={() => setActiveSubView('combined')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubView === 'combined'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista Integral 360°</span>
            </button>
            <button
              onClick={() => setActiveSubView('biometrics')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubView === 'biometrics'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Salud & Biometría</span>
            </button>
            <button
              onClick={() => setActiveSubView('gym')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubView === 'gym'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Gimnasio UPB</span>
            </button>
            <button
              onClick={() => setActiveSubView('hevy')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeSubView === 'hevy'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Hevy Workouts</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. RENDERIZADO CONDICIONAL DE CONTENIDO */}
      {activeSubView === 'combined' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Bloque 1: Panel Biométrico y Readiness en Tiempo Real */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bloque 1: Biometría, Readiness & Conexión Health Connect</span>
              </span>
            </div>
            <GoogleHealthConnector />
          </div>

          {/* Bloque 2: Gimnasio UPB Montería & Sobrecarga Hevy */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 flex items-center gap-1.5">
                <Dumbbell className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Bloque 2: Gimnasio UPB (Horarios Clases) & Sobrecarga Hevy</span>
              </span>
            </div>
            <UnifiedGymHevySection hideHeader={true} initialSubTab="all" />
          </div>
        </div>
      )}

      {activeSubView === 'biometrics' && (
        <div className="animate-fadeIn">
          <GoogleHealthConnector />
        </div>
      )}

      {activeSubView === 'mifitness' && (
        <div className="animate-fadeIn">
          <MiFitnessHealthSuite />
        </div>
      )}

      {activeSubView === 'gym' && (
        <div className="animate-fadeIn">
          <UnifiedGymHevySection hideHeader={false} initialSubTab="schedule" />
        </div>
      )}

      {activeSubView === 'hevy' && (
        <div className="animate-fadeIn">
          <UnifiedGymHevySection hideHeader={false} initialSubTab="hevy" />
        </div>
      )}
    </section>
  );
}
