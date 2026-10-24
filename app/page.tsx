'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  CreditCard,
  GraduationCap,
  Sparkles,
  Footprints,
  Plane,
  Sun,
  Search,
  Moon,
  User,
} from 'lucide-react';
import DashboardOverview from '@/components/DashboardOverview';
import FinanceSection from '@/components/FinanceSection';
import UpbWalkSimulatorSection from '@/components/UpbWalkSimulatorSection';
import MobileTravelDashboard from '@/components/MobileTravelDashboard';
import UnifiedHealthFitnessSection from '@/components/UnifiedHealthFitnessSection';
import UnifiedScheduleCalendarSection from '@/components/UnifiedScheduleCalendarSection';
import UnifiedAcademicSection from '@/components/UnifiedAcademicSection';
import PersonalBioAssistant from '@/components/PersonalBioAssistant';
import AuthShieldGate, { useAuth } from '@/components/AuthShieldGate';
import UserSessionBadge from '@/components/UserSessionBadge';
import CommandPaletteModal from '@/components/CommandPaletteModal';

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
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);

  // Atajo global de teclado Cmd+K / Ctrl+K (Inspirado en sahnia3/life-os)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
                  Plataforma ejecutiva unificada que correlaciona tus <strong>7 dimensiones vitales</strong>: Salud Biométrica & Fitness, Agenda UPB, Academia & Literatura Científica, Paseos Caninos y Finanzas Personales.
                </p>
              </div>

              {/* Botones de Acción Superior: Sesión de Usuario, Modo Oscuro / Claro y Estado */}
              <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
                {/* Badge de Sesión de Usuario con Botón de Cerrar Sesión */}
                <UserSessionBadge session={session} onLogout={logout} />

                {/* Botón Paleta de Comandos Cmd+K */}
                <button
                  onClick={() => setIsCommandOpen(true)}
                  className="cursor-pointer px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-all flex items-center gap-2 group"
                  title="Abrir buscador y comandos rápidos (Ctrl+K / Cmd+K)"
                >
                  <Search className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs font-bold hidden sm:inline">Comandos</span>
                  <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">⌘K</kbd>
                </button>

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

            {/* Barra de Navegación por Pilares (7 Pilares Ejecutivos) */}
            <nav
              className="mb-8 flex items-center gap-2 overflow-x-auto pb-4 custom-nav-scrollbar"
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
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
                onClick={() => setActiveTab('health')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'health' || activeTab === 'gym' || activeTab === 'hevy'
                    ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Activity className={`w-3.5 h-3.5 ${activeTab === 'health' || activeTab === 'gym' || activeTab === 'hevy' ? 'text-white' : 'text-rose-500'}`} />
                <span>Salud, Biometría & Fitness</span>
              </button>
              <button
                onClick={() => setActiveTab('horario')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'horario' || activeTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${activeTab === 'horario' || activeTab === 'calendar' ? 'text-white' : 'text-blue-500'}`} />
                <span>Agenda & Horario UPB</span>
              </button>
              <button
                onClick={() => setActiveTab('grades')}
                className={`cursor-pointer px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  activeTab === 'grades' || activeTab === 'science'
                    ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${activeTab === 'grades' || activeTab === 'science' ? 'text-white' : 'text-amber-500'}`} />
                <span>Academia & Literatura UPB</span>
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
                  <DashboardOverview onNavigate={(tab) => setActiveTab(tab)} />
                </div>
              )}

              {activeTab === 'bio' && (
                <div className="animate-fadeIn">
                  <PersonalBioAssistant />
                </div>
              )}

              {(activeTab === 'health' || activeTab === 'gym' || activeTab === 'hevy') && (
                <div className="animate-fadeIn">
                  <UnifiedHealthFitnessSection />
                </div>
              )}
              {(activeTab === 'horario' || activeTab === 'calendar') && (
                <div className="animate-fadeIn">
                  <UnifiedScheduleCalendarSection />
                </div>
              )}

              {(activeTab === 'grades' || activeTab === 'science') && (
                <div className="animate-fadeIn">
                  <UnifiedAcademicSection />
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
        {/* Paleta Global de Comandos Cmd+K (sahnia3/life-os) */}
        <CommandPaletteModal
          isOpen={isCommandOpen}
          onClose={() => setIsCommandOpen(false)}
          onNavigate={(tab) => setActiveTab(tab)}
        />
      </div>
    </main>
  );
}
