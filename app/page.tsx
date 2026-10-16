'use client';

import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  CreditCard,
  Dumbbell,
  GraduationCap,
  Sparkles,
  Footprints,
  Plane,
  BookOpen,
} from 'lucide-react';
import DashboardOverview from '@/components/DashboardOverview';
import GoogleHealthConnector from '@/components/GoogleHealthConnector';
import GoogleCalendarSection from '@/components/GoogleCalendarSection';
import AcademicGradesSection from '@/components/AcademicGradesSection';
import HevyWorkoutsSection from '@/components/HevyWorkoutsSection';
import FinanceSection from '@/components/FinanceSection';
import UpbWalkSimulatorSection from '@/components/UpbWalkSimulatorSection';
import ScientificNotesSection from '@/components/ScientificNotesSection';
import MobileTravelDashboard from '@/components/MobileTravelDashboard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [viewMode, setViewMode] = useState<'travel' | 'full'>('travel');

  return (
    <main className="min-h-screen bg-slate-50/70 py-6 px-3 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Conmutador de Modo: Viaje Móvil vs Centro de Mando */}
        <div className="mb-6 flex items-center justify-between p-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('travel')}
              className={`flex-1 sm:flex-initial cursor-pointer px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'travel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>✈️ Modo Viaje (Móvil)</span>
            </button>
            <button
              onClick={() => setViewMode('full')}
              className={`flex-1 sm:flex-initial cursor-pointer px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                viewMode === 'full'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🌟 Centro Completo</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline mr-2">
            {viewMode === 'travel' ? '📱 Optimizado para tu teléfono (Maleta, Billetera & Ruta)' : '🖥️ Dashboard de 8 pilares'}
          </span>
        </div>

        {/* VISTA 1: MODO VIAJE MÓVIL */}
        {viewMode === 'travel' && (
          <div className="animate-fadeIn">
            <MobileTravelDashboard />
          </div>
        )}

        {/* VISTA 2: CENTRO DE MANDO COMPLETO */}
        {viewMode === 'full' && (
          <div className="animate-fadeIn">
        {/* Header Superior Ejecutivo */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>MegaProyecto • Sistema Integral de Vida, Ciencia y Rendimiento</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Centro de Mando Personal
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 max-w-2xl leading-relaxed">
              Plataforma unificada que correlaciona tus dimensiones vitales: <strong>Salud Biométrica</strong> (Health Connect), <strong>Entrenamientos</strong> (Hevy), <strong>Agenda UPB</strong>, <strong>Economía & Medellín 2026</strong>, <strong>Paseos Caninos</strong> y <strong>Notas & Literatura Científica</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Ecosistema Completo</span>
                <span className="text-[10px] text-slate-400">HL7 FHIR • OpenAlex • Room • Nu</span>
              </div>
            </div>
          </div>
        </header>

        {/* Barra de Navegación por Pilares (Modo Exclusivo) */}
        <nav className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-900/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vista General</span>
          </button>
          <button
            onClick={() => setActiveTab('health')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Salud & VYFITH_APP</span>
          </button>
          <button
            onClick={() => setActiveTab('hevy')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'hevy'
                ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-rose-500" />
            <span>Hevy Workouts</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'grades'
                ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            <span>Notas del Semestre</span>
          </button>
          <button
            onClick={() => setActiveTab('science')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'science'
                ? 'bg-violet-600 text-white shadow-md ring-2 ring-violet-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-violet-500" />
            <span>Notas & Referencias</span>
          </button>
          <button
            onClick={() => setActiveTab('walks')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'walks'
                ? 'bg-amber-700 text-white shadow-md ring-2 ring-amber-700/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 text-amber-600" />
            <span>Paseos & Rutina UPB</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'finance'
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            <span>Finanzas & iPhone</span>
          </button>
        </nav>

        {/* Renderizado Exclusivo: Sólo el Pilar Seleccionado */}
        <div className="transition-all duration-200">
          {activeTab === 'overview' && (
            <div className="animate-fadeIn">
              <DashboardOverview />
            </div>
          )}

          {activeTab === 'health' && (
            <div className="animate-fadeIn">
              <GoogleHealthConnector />
            </div>
          )}

          {activeTab === 'hevy' && (
            <div className="animate-fadeIn">
              <HevyWorkoutsSection />
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="animate-fadeIn">
              <GoogleCalendarSection />
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="animate-fadeIn">
              <AcademicGradesSection />
            </div>
          )}

          {activeTab === 'science' && (
            <div className="animate-fadeIn">
              <ScientificNotesSection />
            </div>
          )}

          {activeTab === 'walks' && (
            <div className="animate-fadeIn">
              <UpbWalkSimulatorSection />
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="animate-fadeIn">
              <FinanceSection />
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>
            MegaProyecto • Arquitectura de Vida y Rendimiento Unificado (Salud FHIR R4, Hevy, OpenAlex Papers, Rutinas UPB Montería, Finanzas Medellín 2026).
          </p>
        </footer>
          </div>
        )}
      </div>
    </main>
  );
}
