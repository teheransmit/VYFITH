'use client';

import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  CreditCard,
  Dumbbell,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import DashboardOverview from '@/components/DashboardOverview';
import GoogleHealthConnector from '@/components/GoogleHealthConnector';
import GoogleCalendarSection from '@/components/GoogleCalendarSection';
import AcademicGradesSection from '@/components/AcademicGradesSection';
import HevyWorkoutsSection from '@/components/HevyWorkoutsSection';
import FinanceSection from '@/components/FinanceSection';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('all');

  const scrollTo = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-6xl mx-auto">
        {/* Header Superior Ejecutivo */}
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>MegaProyecto • Sistema Integral de Vida y Rendimiento</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Centro de Mando Personal
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 max-w-2xl leading-relaxed">
              Plataforma unificada que correlaciona tus 5 pilares vitales: <strong>Salud Biométrica</strong> (Health Connect / VYFITH_APP), <strong>Entrenamientos de Fuerza</strong> (Hevy), <strong>Agenda</strong> (Google Calendar API), <strong>Notas del Semestre</strong> y <strong>Economía</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">5 Motores Activos</span>
                <span className="text-[10px] text-slate-400">HL7 FHIR • OAuth • Room</span>
              </div>
            </div>
          </div>
        </header>

        {/* Barra de Navegación por Pilares */}
        <nav className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            🌟 Vista Integral Completa
          </button>
          <button
            onClick={() => scrollTo('health-sync-section')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'health-sync-section'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            Salud & VYFITH_APP
          </button>
          <button
            onClick={() => scrollTo('hevy-workouts-section')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'hevy-workouts-section'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-rose-500" />
            Hevy Workouts
          </button>
          <button
            onClick={() => scrollTo('google-calendar-section')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'google-calendar-section'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            Google Calendar
          </button>
          <button
            onClick={() => scrollTo('academic-grades-section')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'academic-grades-section'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
            Notas del Semestre
          </button>
          <button
            onClick={() => scrollTo('finance-section')}
            className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'finance-section'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
            Finanzas & Ahorro
          </button>
        </nav>

        {/* 1. Vista General Ejecutiva & Gráficos Multivariables */}
        <DashboardOverview />

        {/* 2. Pilar 1: Salud Biométrica y Conexión con VYFITH_APP */}
        <div id="health-sync-section">
          <GoogleHealthConnector />
        </div>

        {/* 3. Pilar 2: Entrenamientos Hevy (Fuerza & Volumen) */}
        <HevyWorkoutsSection />

        {/* 4. Pilar 4: Google Calendar (OAuth 2.0 y Eventos) */}
        <GoogleCalendarSection />

        {/* 5. Pilar 5: Notas del Semestre Universitario & GPA */}
        <AcademicGradesSection />

        {/* 6. Pilar 3: Finanzas Personales & Presupuesto */}
        <FinanceSection />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
          <p>
            MegaProyecto • Arquitectura de Datos Correlacionados (HL7 FHIR R4, Hevy Strength, Google Calendar OAuth 2.0 & Room Database).
          </p>
        </footer>
      </div>
    </main>
  );
}
