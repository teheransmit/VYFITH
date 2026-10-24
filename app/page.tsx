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
import SessionThemeControls from '@/components/SessionThemeControls';
import { DASHBOARD_NAV_ITEMS, DashboardTab } from '@/lib/navigation';

const NAV_COLOR_CLASSES = {
  slate: ['bg-slate-900 dark:bg-indigo-600 text-white shadow-md ring-2 ring-slate-900/20 dark:ring-indigo-600/30', 'text-slate-500 dark:text-slate-400'],
  indigo: ['bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600/20', 'text-indigo-500'],
  rose: ['bg-rose-600 text-white shadow-md ring-2 ring-rose-600/20', 'text-rose-500'],
  blue: ['bg-blue-600 text-white shadow-md ring-2 ring-blue-600/20', 'text-blue-500'],
  amber: ['bg-amber-600 text-white shadow-md ring-2 ring-amber-600/20', 'text-amber-500'],
  emerald: ['bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/20', 'text-emerald-500'],
} as const;

const NAV_ICONS = {
  sparkles: Sparkles,
  user: User,
  activity: Activity,
  calendar: Calendar,
  graduation: GraduationCap,
  footprints: Footprints,
  'credit-card': CreditCard,
} as const;

export default function Home() {
  return (
    <AuthShieldGate>
      <HomeDashboard />
    </AuthShieldGate>
  );
}

function HomeDashboard() {
  const { session, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
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
    const nextIsDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    const themeId = window.setTimeout(() => setIsDarkMode(nextIsDark), 0);
    if (nextIsDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return () => window.clearTimeout(themeId);
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
      <div className="app-shell mx-auto w-full min-w-0">
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
                <SessionThemeControls
                  session={session}
                  onLogout={logout}
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                />
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
              <div className="flex items-center gap-2 self-stretch sm:self-start md:self-center flex-wrap justify-between sm:justify-start">
                <SessionThemeControls
                  session={session}
                  onLogout={logout}
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                  onOpenCommands={() => setIsCommandOpen(true)}
                />

                {/* Badge de Ecosistema (Oculto en móviles para evitar saturación de pantalla) */}
                <div className="hidden md:flex px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block">Ecosistema Completo</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">HL7 FHIR • OpenAlex • Room • Nu</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Navegación dinámica: se distribuye en escritorio y se desplaza en móvil. */}
            <nav
              aria-label="Secciones principales"
              className="mb-8 flex items-center gap-2 overflow-x-auto pb-4 custom-nav-scrollbar lg:overflow-visible lg:flex-wrap"
              onWheel={(e) => {
                if (e.deltaY !== 0) {
                  e.currentTarget.scrollLeft += e.deltaY;
                }
              }}
            >
              {DASHBOARD_NAV_ITEMS.map((item) => {
                const Icon = NAV_ICONS[item.icon];
                const [activeClasses, inactiveIconClasses] = NAV_COLOR_CLASSES[item.color];
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.commandTitle}
                    className={`cursor-pointer min-h-10 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center justify-center gap-1.5 lg:flex-1 ${
                      isActive
                        ? activeClasses
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : inactiveIconClasses}`} />
                    <span>{item.shortLabel}</span>
                  </button>
                );
              })}
            </nav>

            {/* Renderizado Exclusivo: Sólo el Pilar Seleccionado */}
            <div className="transition-all duration-200">
              {activeTab === 'overview' && (
                <div className="animate-fadeIn">
                  <DashboardOverview onNavigate={(tab) => {
                    if (DASHBOARD_NAV_ITEMS.some((item) => item.id === tab)) {
                      setActiveTab(tab as DashboardTab);
                    }
                  }} />
                </div>
              )}

              {activeTab === 'bio' && (
                <div className="animate-fadeIn">
                  <PersonalBioAssistant />
                </div>
              )}

              {activeTab === 'health' && (
                <div className="animate-fadeIn">
                  <UnifiedHealthFitnessSection />
                </div>
              )}
              {activeTab === 'horario' && (
                <div className="animate-fadeIn">
                  <UnifiedScheduleCalendarSection />
                </div>
              )}

              {activeTab === 'grades' && (
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
          onNavigate={(tab) => {
            if (DASHBOARD_NAV_ITEMS.some((item) => item.id === tab)) {
              setActiveTab(tab as DashboardTab);
            }
          }}
        />
      </div>
    </main>
  );
}
