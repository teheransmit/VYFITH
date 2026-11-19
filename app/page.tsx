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
import CognitivePulseSentinel from '@/components/CognitivePulseSentinel';
import GlobalVyfithCloudBridge from '@/components/GlobalVyfithCloudBridge';
import AuthShieldGate, { useAuth } from '@/components/AuthShieldGate';
import UserSessionBadge from '@/components/UserSessionBadge';
import CommandPaletteModal from '@/components/CommandPaletteModal';
import SessionThemeControls from '@/components/SessionThemeControls';
import { DASHBOARD_NAV_ITEMS, DashboardTab } from '@/lib/navigation';

const UNIFIED_ACTIVE_NAV =
  'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs ring-1 ring-zinc-900/10 dark:ring-white/20';

const NAV_COLOR_CLASSES = {
  slate: [UNIFIED_ACTIVE_NAV, 'text-zinc-500 dark:text-zinc-400'],
  indigo: [UNIFIED_ACTIVE_NAV, 'text-indigo-500 dark:text-indigo-400'],
  rose: [UNIFIED_ACTIVE_NAV, 'text-rose-500 dark:text-rose-400'],
  blue: [UNIFIED_ACTIVE_NAV, 'text-sky-500 dark:text-sky-400'],
  amber: [UNIFIED_ACTIVE_NAV, 'text-amber-500 dark:text-amber-400'],
  emerald: [UNIFIED_ACTIVE_NAV, 'text-emerald-500 dark:text-emerald-400'],
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

  // Permitir navegaci?n directa por query param ?tab=xxx o hash #xxx
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as DashboardTab;
      if (tabParam && DASHBOARD_NAV_ITEMS.some((item) => item.id === tabParam)) {
        setActiveTab(tabParam);
      } else if (window.location.hash) {
        const hashTab = window.location.hash.replace('#', '') as DashboardTab;
        if (hashTab && DASHBOARD_NAV_ITEMS.some((item) => item.id === hashTab)) {
          setActiveTab(hashTab);
        }
      }
    }
  }, []);
  // Por defecto en PC: inicia directamente en el Centro de Mando completo (8 pilares)
  const [viewMode, setViewMode] = useState<'travel' | 'full'>('full');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'puzzle' | 'expanded'>('puzzle');

  // Cargar preferencia de layout (Modo Rompecabezas por defecto)
  useEffect(() => {
    const saved = localStorage.getItem('vyfith_layout_mode');
    if (saved === 'expanded' || saved === 'puzzle') {
      setLayoutMode(saved);
    }
  }, []);

  const toggleLayoutMode = () => {
    const nextMode = layoutMode === 'puzzle' ? 'expanded' : 'puzzle';
    setLayoutMode(nextMode);
    localStorage.setItem('vyfith_layout_mode', nextMode);
  };

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
    <main className="min-h-screen bg-[#f6f7f9] dark:bg-[#090a0d] text-zinc-900 dark:text-zinc-100 py-6 px-3 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <GlobalVyfithCloudBridge />
      <div className={`app-shell mx-auto w-full min-w-0 ${layoutMode === 'puzzle' ? 'puzzle-mode' : 'expanded-mode'}`}>
        {/* Banner discreto de modo rompecabezas en monitores grandes */}
        {/* VISTA 1: MODO VIAJE MÓVIL (Preservado para móvil / desplazamientos futuros) */}
        {viewMode === 'travel' && (
          <div className="animate-fadeIn">
            {/* Barra superior de retorno al Centro de Mando PC */}
            <div className="mb-6 flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#111318] border border-zinc-200/80 dark:border-white/[0.07] shadow-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 font-semibold">
                <Plane className="w-4 h-4 text-emerald-500" />
                <span>Modo Viaje (Móvil) Activo — Optimizado para smartphone</span>
              </div>
              <div className="flex items-center gap-2">
                <SessionThemeControls
                  session={session}
                  onLogout={logout}
                  isDarkMode={isDarkMode}
                  onToggleTheme={toggleTheme}
                  layoutMode={layoutMode}
                  onToggleLayoutMode={toggleLayoutMode}
                />
                <button
                  onClick={() => setViewMode('full')}
                  className="cursor-pointer px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-white transition-all flex items-center gap-1.5 shadow-xs"
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
            {/* Header Superior Ejecutivo Unslop */}
            <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-200/80 dark:border-white/[0.07]">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-white dark:bg-[#111318] text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/[0.08] mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>VYFITH OS • Santiago Teherán (21 años)</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white tracking-tight">
                  Centro de Mando Personal
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed">
                  Ecosistema vivo conectado a tu salud biométrica, Hevy, Google Calendar Auto-Invite, finanzas en Nequi/Nu y agenda UPB Montería.
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
                  layoutMode={layoutMode}
                  onToggleLayoutMode={toggleLayoutMode}
                />

                {/* Badge de Ecosistema */}
                <div className="hidden md:flex px-3.5 py-2 rounded-xl bg-white dark:bg-[#111318] border border-zinc-200/80 dark:border-white/[0.07] items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-xs">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 block">Ecosistema Sincronizado</span>
                    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">FHIR • Google • Nequi/Nu</span>
                  </div>
                </div>
              </div>
            </header>

            {/* Pulso Cognitivo Vivo & Sentinel Auto-Reparador */}
            <CognitivePulseSentinel
              onNavigate={(tab) => {
                if (DASHBOARD_NAV_ITEMS.some((item) => item.id === tab)) {
                  setActiveTab(tab);
                }
              }}
            />

            {/* Navegación dinámica unificada Unslop */}
            <nav
              aria-label="Secciones principales"
              className="mb-6 flex items-center gap-1.5 overflow-x-auto pb-3 custom-nav-scrollbar lg:overflow-visible lg:flex-wrap"
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
                    className={`cursor-pointer min-h-9.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center justify-center gap-1.5 lg:flex-1 ${
                      isActive
                        ? activeClasses
                        : 'bg-white dark:bg-[#111318] text-zinc-600 dark:text-zinc-300 border border-zinc-200/80 dark:border-white/[0.07] hover:bg-zinc-50 dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive ? 'text-white dark:text-zinc-950' : inactiveIconClasses
                      }`}
                    />
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
                  <UnifiedScheduleCalendarSection onNavigate={setActiveTab} />
                </div>
              )}

              {activeTab === 'grades' && (
                <div className="animate-fadeIn">
                  <UnifiedAcademicSection onNavigate={setActiveTab} />
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
