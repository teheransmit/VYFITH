'use client';

import React, { useState, useEffect } from 'react';
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
  Sun,
  Moon,
  User,
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
import ScheduleManagerSection from '@/components/ScheduleManagerSection';
import UnifiedGymHevySection from '@/components/UnifiedGymHevySection';
import PersonalBioAssistant from '@/components/PersonalBioAssistant';
import AuthShieldGate, { useAuth } from '@/components/AuthShieldGate';
import UserSessionBadge from '@/components/UserSessionBadge';

export default function Home() {
  return (
    <AuthShieldGate>
      <HomeDashboard />
    </AuthShieldGate>
  );
}

function HomeDashboard() {
  const { session, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('overview');
  // Por defecto en PC: inicia directamente en el Centro de Mando completo (8 pilares)
  const [viewMode, setViewMode] = useState<'travel' | 'full'>('full');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Detección y persistencia de Tema (Modo Claro / Modo Oscuro)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    if (nextTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/70 dark:bg-slate-950 py-6 px-3 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* VISTA 1: MODO VIAJE MÓVIL (Preservado para móvil / desplazamientos futuros) */}
        {viewMode === 'travel' && (
          <div className="animate-fadeIn">
            {/* Barra superior de retorno al Centro de Mando PC */}
            <div className="mb-6 flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                <Plane className="w-4 h-4 text-emerald-500" />
                <span>Modo Viaje (Móvil) Activo — Optimizado para smartphone</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Badge de Sesión */}
                <UserSessionBadge session={session} onLogout={logout} />

                {/* Alternar Tema */}
                <button
                  onClick={toggleTheme}
                  aria-label="Alternar tema"
                  className="cursor-pointer p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                </button>
                <button
                  onClick={() => setViewMode('full')}
                  className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-black bg-slate-900 dark:bg-indigo-600 text-white hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>← Volver al Centro de Mando (PC)</span>
                </button>
              </div>
            </div>
            <MobileTravelDashboard />
          </div>
        )}

        {/* VISTA 2: CENTRO DE MANDO COMPLETO (Desktop Ejecutivo de 8 Pilares) */}
        {viewMode === 'full' && (
          <div className="animate-fadeIn">
            {/* Header Superior Ejecutivo con Botón de Modo Oscuro, Sesión y Accesos */}
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>MegaProyecto • Sistema Integral de Vida, Ciencia y Rendimiento</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Centro de Mando Personal
                </h1>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                  Plataforma unificada que correlaciona tus dimensiones vitales: <strong>Salud Biométrica</strong> (Health Connect), <strong>Entrenamientos</strong> (Hevy), <strong>Agenda UPB</strong>, <strong>Economía & Medellín 2026</strong>, <strong>Paseos Caninos</strong> y <strong>Notas & Literatura Científica</strong>.
                </p>
              </div>

              {/* Botones de Acción Superior: Sesión de Usuario, Modo Oscuro / Claro y Estado */}
              <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
                {/* Badge de Sesión de Usuario con Botón de Cerrar Sesión */}
                <UserSessionBadge session={session} onLogout={logout} />

                {/* Switcher Modo Oscuro / Claro */}
                <button
                  onClick={toggleTheme}
                  aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                  className="cursor-pointer px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-all flex items-center gap-2 group"
                >
                  {isDarkMode ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400 transition-transform group-hover:rotate-45" />
                      <span className="text-xs font-bold text-slate-200">Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-600 transition-transform group-hover:-rotate-12" />
                      <span className="text-xs font-bold text-slate-700">Modo Oscuro</span>
                    </>
                  )}
                </button>

                {/* Badge de Ecosistema */}
                <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">Ecosistema Completo</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">HL7 FHIR • OpenAlex • Room • Nu</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Barra de Navegación por Pilares (8 Pilares) */}
            <nav className="mb-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setActiveTab('overview')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'bg-slate-900 dark:bg-indigo-600 text-white shadow-md ring-2 ring-slate-900/20 dark:ring-indigo-600/30'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Sparkles className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>Vista General</span>
              </button>
              <button
                onClick={() => setActiveTab('bio')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'bio'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${activeTab === 'bio' ? 'text-white' : 'text-indigo-500'}`} />
                <span>Bio & Portafolio IA</span>
              </button>
              <button
                onClick={() => setActiveTab('gym')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'gym' || activeTab === 'hevy'
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Dumbbell className={`w-3.5 h-3.5 ${activeTab === 'gym' || activeTab === 'hevy' ? 'text-white' : 'text-rose-500'}`} />
                <span>Gimnasio UPB & Hevy</span>
              </button>
              <button
                onClick={() => setActiveTab('horario')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'horario'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${activeTab === 'horario' ? 'text-white' : 'text-blue-500'}`} />
                <span>Horario UPB (Notion)</span>
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'health'
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${activeTab === 'health' ? 'text-white' : 'text-indigo-500'}`} />
                <span>Salud & VYFITH_APP</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${activeTab === 'calendar' ? 'text-white' : 'text-blue-500'}`} />
                <span>Google Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'grades'
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'grades' ? 'text-white' : 'text-amber-500'}`} />
                <span>Notas del Semestre</span>
              </button>
              <button
                onClick={() => setActiveTab('science')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'science'
                    ? 'bg-violet-600 text-white shadow-md ring-2 ring-violet-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'science' ? 'text-white' : 'text-violet-500'}`} />
                <span>Notas & Referencias</span>
              </button>
              <button
                onClick={() => setActiveTab('walks')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'walks'
                    ? 'bg-amber-700 text-white shadow-md ring-2 ring-amber-700/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Footprints className={`w-3.5 h-3.5 ${activeTab === 'walks' ? 'text-white' : 'text-amber-600'}`} />
                <span>Paseos & Rutina UPB</span>
              </button>
              <button
                onClick={() => setActiveTab('finance')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'finance'
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'finance' ? 'text-white' : 'text-emerald-500'}`} />
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

              {activeTab === 'bio' && (
                <div className="animate-fadeIn">
                  <PersonalBioAssistant />
                </div>
              )}

              {(activeTab === 'gym' || activeTab === 'hevy') && (
                <div className="animate-fadeIn">
                  <UnifiedGymHevySection />
                </div>
              )}
              {activeTab === 'horario' && (
                <div className="animate-fadeIn">
                  <ScheduleManagerSection />
                </div>
              )}

              {activeTab === 'health' && (
                <div className="animate-fadeIn">
                  <GoogleHealthConnector />
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

            {/* Footer con enlace sutil a Modo Viaje (Móvil) preservado */}
            <footer className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                MegaProyecto • Arquitectura de Vida y Rendimiento Unificado (Salud FHIR R4, Hevy, OpenAlex Papers, Rutinas UPB Montería, Finanzas Medellín 2026).
              </p>
              <button
                onClick={() => setViewMode('travel')}
                className="cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline flex items-center gap-1 transition-colors"
              >
                <Plane className="w-3 h-3" />
                <span>Ver Modo Viaje (Móvil)</span>
              </button>
            </footer>
          </div>
        )}
      </div>
    </main>
  );
}
