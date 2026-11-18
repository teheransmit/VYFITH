'use client';

import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Printer,
  Download,
  ExternalLink,
  Sparkles,
  Dumbbell,
  Layers,
  ShieldCheck,
  Lock,
  FlaskConical,
  AlertTriangle,
  RotateCcw,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react';
import {
  ScheduleBlock,
  DayName,
  TrackedCourseId,
  generateScheduleIcs,
  toMinutes,
} from '@/lib/academicReactiveEngine';
import { useAcademicReactiveState } from '@/lib/useAcademicReactiveState';
import { DashboardTab } from '@/lib/navigation';

export type { ScheduleBlock };

type ScheduleScenarioKey = '2027_1_dynamic' | '2026_2_official' | '2027_1_contingency';

const DAYS: DayName[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function formatCop(amount: number): string {
  return `$${amount.toLocaleString('es-CO')}`;
}

export default function ScheduleManagerSection({
  onNavigate,
}: {
  onNavigate?: (tab: DashboardTab) => void;
}) {
  const [scenario, setScenario] = useState<ScheduleScenarioKey>('2027_1_dynamic');
  const [selectedDay, setSelectedDay] = useState<string>('todos');
  const [filterView, setFilterView] = useState<'grid' | 'cards'>('grid');

  const {
    overrides,
    projection,
    saving,
    lastSyncError,
    updateOverrides,
    toggleHomologateSuelosLab,
    resetAcademicOverrides,
  } = useAcademicReactiveState();

  const activePlan =
    scenario === '2027_1_contingency'
      ? projection.schedule2027Contingency
      : projection.schedule2027Real;

  const schedule: ScheduleBlock[] =
    scenario === '2026_2_official' ? projection.schedule2026Official : activePlan.blocks;

  const filteredBlocks =
    selectedDay === 'todos' ? schedule : schedule.filter((s) => s.day === selectedDay);

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportIcs = () => {
    const icsRaw = generateScheduleIcs(schedule, scenario);
    const blob = new Blob([icsRaw], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Horario_UPB_Santiago_${scenario}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const suelosProj = projection.projectedCourseMap['c-suelos'];

  const renderPrereqStatusCard = (
    courseId: TrackedCourseId,
    label: string,
    blockedCourse: string
  ) => {
    const proj = projection.projectedCourseMap[courseId];
    const score = proj?.accumulatedPoints ?? 0;
    const isPassing = proj?.isPassingForPrereqs;

    return (
      <div
        key={courseId}
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 px-3 py-2"
      >
        <div className="min-w-0">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
            {label}
          </span>
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            SIGAA Real: {score.toFixed(2)} / 5.00 (100% evaluado)
          </span>
        </div>
        <div>
          {isPassing ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-3 h-3" />
              Aprobada en SIGAA
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <XCircle className="w-3 h-3" />
              Reprobada ❌ (Bloquea {blockedCourse})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <section
      id="schedule-manager-section"
      className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10"
    >
      {/* Header Superior */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Motor Reactivo de Horarios SIGAA (`202620` → `202710` / `202750`)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              {scenario === '2026_2_official'
                ? 'Horario SIGAA 2026-2 Verificado'
                : `${activePlan.overlapMinutes} min cruce • ${
                    activePlan.morningProtected ? 'Mañanas L-J protegidas' : 'Con clase en mañana'
                  }`}
            </span>
            {saving && (
              <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">
                Sincronizando…
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {scenario === '2026_2_official'
              ? 'Horario Académico Oficial 2026-II (5 Materias • 13 Créditos)'
              : scenario === '2027_1_dynamic'
              ? `Proyección Viva 2027-I • ${activePlan.totalCredits} Créditos (${
                  activePlan.suelosMode === 'theory_only_homologated'
                    ? 'Suelos Solo Teoría + Lab Homologado'
                    : activePlan.suelosMode === 'full_theory_and_lab'
                    ? 'Suelos Completo Teoría + Lab'
                    : 'Cimentaciones Desbloqueada'
                })`
              : `Contingencia Extrema 2027-I • ${activePlan.totalCredits} Créditos (Si reprueba pendientes)`}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl mt-1">
            Conectado en vivo con <strong>Estudio / SIGAA</strong>: perder{' '}
            <strong>Mecánica de Suelos (2.50 &lt; 3.000)</strong> bloquea{' '}
            <strong>Cimentaciones</strong> y programa su repetición en <strong>2027-I</strong>. Al
            homologar su laboratorio (promedio <strong>{projection.suelosLabSummary.weightedAverage.toFixed(2)} ≥ 4.00</strong>), solo cursas teoría{' '}
            <strong>Mar/Jue 14:00</strong> y se liberan <strong>Mié/Vie 14:00</strong>.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('grades')}
              className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              <span>Editar Notas en Estudio</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={handleExportIcs}
            className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            title="Descargar archivo estándar .ics compatible con Google Calendar, Apple Calendar y Outlook"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar .ics</span>
          </button>
          <a
            href="https://vine-sternum-6db.notion.site/HORARIO-210f834da25880df9892f70cb70c5e24"
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Notion</span>
          </a>
          <button
            type="button"
            onClick={handlePrintPdf}
            className="cursor-pointer flex-1 sm:flex-initial justify-center inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Selector de Escenario */}
      <div className="mt-5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>Escenario Activo:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1 max-w-3xl">
          <button
            type="button"
            onClick={() => setScenario('2027_1_dynamic')}
            className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
              scenario === '2027_1_dynamic'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="truncate">⚡ 2027-1 Plan Real Reactivo</div>
            <div className="text-[10px] opacity-85 font-normal">
              {projection.schedule2027Real.totalCredits} cr ({formatCop(projection.schedule2027Real.totalNetTuition)}) •{' '}
              {projection.schedule2027Real.englishNrc ?? 'Sin Inglés'}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScenario('2026_2_official')}
            className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
              scenario === '2026_2_official'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="truncate">📌 2026-2 Oficial (Actual)</div>
            <div className="text-[10px] opacity-85 font-normal">
              5 Materias • 13 cr • {projection.schedule2026Official.length} bloques
            </div>
          </button>

          <button
            type="button"
            onClick={() => setScenario('2027_1_contingency')}
            className={`cursor-pointer px-3 py-2 rounded-xl text-xs font-bold text-left transition-all border ${
              scenario === '2027_1_contingency'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="truncate">🛡️ 2027-1 Contingencia Total</div>
            <div className="text-[10px] opacity-85 font-normal">
              {projection.schedule2027Contingency.totalCredits} cr ({formatCop(projection.schedule2027Contingency.totalNetTuition)}) si cae todo
            </div>
          </button>
        </div>
      </div>

      {/* PANEL DE IMPACTO SISTÉMICO & HOMOLOGACIÓN EN VIVO */}
      {scenario !== '2026_2_official' && (
        <div
          id="systemic-impact-panel"
          className="mt-4 rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-slate-950/60 p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                Panel de Impacto Sistémico & Homologación en Vivo
              </h3>
            </div>
            <button
              type="button"
              onClick={resetAcademicOverrides}
              className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restaurar SIGAA</span>
            </button>
          </div>

          {lastSyncError && (
            <div className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5">
              {lastSyncError}
            </div>
          )}

          {/* Fila 1: Bloqueos por Prerrequisito + Toggle Homologación Lab Suelos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Tarjeta Homologación Lab Suelos */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/70 p-3 flex flex-col justify-between gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-300 shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Homologación Laboratorio de Suelos (NRC 13812)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        Lab Prom: {projection.suelosLabSummary.weightedAverage.toFixed(2)} ≥ 4.00
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Labs 2026-2: I ({projection.suelosLabSummary.items[0]?.grade?.toFixed(2)}), II (
                      {projection.suelosLabSummary.items[1]?.grade?.toFixed(2)}), III (
                      {projection.suelosLabSummary.items[2]?.grade?.toFixed(2)}).{' '}
                      {activePlan.suelosMode === 'not_repeated'
                        ? 'Suelos simulada aprobada: no requiere repetir laboratorio.'
                        : activePlan.suelosMode === 'theory_only_homologated'
                        ? 'ACTIVA: Solo ves Teoría (Mar/Jue 14:00 B3). Se liberan Mié y Vie 14:00 (Lab 119) y encaja Ética.'
                        : 'DESACTIVADA: Incluye las 2 sesiones semanales de Lab 119 (Mié/Vie 14:00).'}
                    </p>
                  </div>
                </div>

                {!suelosProj.isPassingForPrereqs && (
                  <button
                    type="button"
                    data-testid="toggle-homologate-suelos-lab"
                    onClick={() => toggleHomologateSuelosLab()}
                    className={`cursor-pointer shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                      overrides.homologateSuelosLab
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {overrides.homologateSuelosLab ? 'Solo Teoría ✓' : 'Incluir Lab 119'}
                  </button>
                )}
              </div>
            </div>

            {/* Tarjeta Bloqueos Automáticos */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-rose-200/90 dark:border-rose-900/60 p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Prerrequisitos Bloqueados ({activePlan.blockedCourses.length}) • Descartadas por Cruce ({activePlan.skippedForConflict.length})
                </span>
              </div>

              {activePlan.blockedCourses.length === 0 ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Todas las materias siguientes de 7.° semestre desbloqueadas.</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {activePlan.blockedCourses.map((b) => (
                    <div
                      key={b.nrc}
                      className="text-[11px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-2.5 py-1 flex items-center justify-between gap-2"
                    >
                      <span className="font-semibold">
                        🔒 {b.name} ({b.nrc}, {b.credits} cr)
                      </span>
                      <span className="text-[10px] opacity-85 truncate">{b.reason}</span>
                    </div>
                  ))}
                </div>
              )}

              {activePlan.skippedForConflict.map((s) => (
                <div
                  key={s.nrc}
                  className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2.5 py-1 flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>
                    <strong>{s.name}</strong> ({s.nrc}) excluida: {s.reason}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fila 2: Estado real materias llave SIGAA + Optativas 2027-1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Estado Real SIGAA Materias Llave 2026-2 (Impacto en Prerrequisitos 2027-1)
              </span>
              {renderPrereqStatusCard(
                'c-suelos',
                'Mecánica de Suelos',
                'Cimentaciones'
              )}
              {renderPrereqStatusCard(
                'c-estructuras',
                'Análisis de Estructuras',
                'Concreto I'
              )}
              {renderPrereqStatusCard(
                'c-hidrologia',
                'Fundamentos de Hidrología',
                'Acueducto y Alcantarillado'
              )}
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                Optativas CBFH & Módulos 2027-1 (Auto-Encaje Sin Cruces)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateOverrides({ includeEtica: !overrides.includeEtica })}
                  className={`cursor-pointer text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                    overrides.includeEtica
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Ética Profesional (1 cr)</div>
                  <div className="text-[10px] opacity-85">Mié 14:00 (si Lab libre)</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateOverrides({
                      includeEmprendimiento:
                        overrides.includeEmprendimiento === 'auto'
                          ? 'always'
                          : overrides.includeEmprendimiento === 'always'
                          ? 'never'
                          : 'auto',
                    })
                  }
                  className={`cursor-pointer text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                    overrides.includeEmprendimiento !== 'never'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold">
                    Emprendimiento ({overrides.includeEmprendimiento.toUpperCase()})
                  </div>
                  <div className="text-[10px] opacity-85">Mar/Jue 12:00 • Plan B Concreto I</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateOverrides({ includeElementosCiudad: !overrides.includeElementosCiudad })
                  }
                  className={`cursor-pointer text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                    overrides.includeElementosCiudad
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Elementos Ciudad (2 cr)</div>
                  <div className="text-[10px] opacity-85">Vie 14:00-17:20 (solo sin Lab)</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    updateOverrides({ includeContratacion: !overrides.includeContratacion })
                  }
                  className={`cursor-pointer text-left px-3 py-2 rounded-xl border text-xs transition-all ${
                    overrides.includeContratacion
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="font-bold">Contratación y Leg. (2 cr)</div>
                  <div className="text-[10px] opacity-85">Vie 06:00-09:40 (mañana)</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros por Día y Vista */}
      <div className="my-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDay('todos')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
              selectedDay === 'todos'
                ? 'bg-slate-900 dark:bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Toda la Semana
          </button>
          {DAYS.map((d) => (
            <button
              type="button"
              key={d}
              onClick={() => setSelectedDay(d)}
              className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                selectedDay === d
                  ? 'bg-slate-900 dark:bg-indigo-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setFilterView('grid')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterView === 'grid'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Rejilla Semanal
          </button>
          <button
            type="button"
            onClick={() => setFilterView('cards')}
            className={`cursor-pointer px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterView === 'cards'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Lista de Bloques
          </button>
        </div>
      </div>

      {/* VISTA 1: REJILLA SEMANAL INTERACTIVA */}
      {filterView === 'grid' && (
        <div className="space-y-2">
          <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/40 text-[11px] font-medium text-blue-700 dark:text-blue-300 text-center">
            <span>👉 Desliza horizontalmente para ver todos los días de la semana</span>
          </div>
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl scrollbar-none sm:custom-nav-scrollbar">
            <div className="min-w-[800px] grid grid-cols-7 divide-x divide-slate-200 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-950/60">
              {/* Columna Horas */}
              <div className="p-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
                  Hora
                </span>
                <div className="space-y-6 text-center">
                  {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((h) => (
                    <div key={h} className="text-xs font-mono text-slate-400 dark:text-slate-500 py-2">
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Columnas Días */}
              {DAYS.map((day) => {
                const dayBlocks = schedule
                  .filter((b) => b.day === day)
                  .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
                return (
                  <div key={day} className="p-2.5 flex flex-col justify-start">
                    <div className="text-center pb-2 mb-2 border-b border-slate-200/80 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-200 block">{day}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {dayBlocks.length} {dayBlocks.length === 1 ? 'bloque' : 'bloques'}
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[360px]">
                      {dayBlocks.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center p-4">
                          <span className="text-[11px] text-slate-400/60 dark:text-slate-600 italic">
                            Libre de clases
                          </span>
                        </div>
                      ) : (
                        dayBlocks.map((b) => (
                          <div
                            key={b.id}
                            className={`p-2.5 rounded-xl border transition-all hover:scale-[1.02] shadow-xs ${b.bgDark} ${b.borderDark} bg-white`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {b.startTime} - {b.endTime}
                              </span>
                              {b.componentType === 'theory' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200">
                                  TEORÍA
                                </span>
                              )}
                              {b.componentType === 'lab' && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                                  LAB
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                              {b.name}
                            </h4>

                            <div className="mt-1.5 space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate font-medium">{b.classroom}</span>
                              </div>
                              <div className="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate">
                                {b.code}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: LISTA DE TARJETAS */}
      {filterView === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlocks.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-2xl border transition-all shadow-xs ${b.bgDark} ${b.borderDark} bg-white dark:bg-slate-900`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {b.day} • {b.startTime} - {b.endTime}
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80">
                  {b.code}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">{b.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.professor}</p>
              {b.note && (
                <p className="text-[11px] text-teal-600 dark:text-teal-300 mt-1 font-medium">{b.note}</p>
              )}

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-semibold">{b.classroom}</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{b.building}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resumen Dinámico de Carga Académica */}
      <div className="mt-6 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            {scenario === '2026_2_official' ? <Sparkles className="w-4 h-4" /> : <Dumbbell className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
              {scenario === '2026_2_official'
                ? 'Distribución Espacial Oficial SIGAA 2026-II (Campus UPB Montería)'
                : `Arquitectura Reactiva 2027-I • ${activePlan.enrolledCourses.length} Asignaturas / Módulos`}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {scenario === '2026_2_official' ? (
                <>
                  Tus 5 asignaturas vigentes (<code>202620</code>): <strong>Vías II (3.10)</strong>,{' '}
                  <strong>Presupuesto (3.28)</strong>, <strong>Estructuras (2.47/60%)</strong>,{' '}
                  <strong>Hidrología (1.72/40%)</strong> y{' '}
                  <strong>Mecánica de Suelos (❌ 2.50 — Reprobada)</strong>.
                </>
              ) : (
                <>
                  Inscritas: {activePlan.enrolledCourses.map((c) => c.name).join(' • ')}. Matrícula neta TBEA 95%:{' '}
                  <strong>{formatCop(activePlan.totalNetTuition)}</strong> (sobrante{' '}
                  <strong>{formatCop(activePlan.surplusForGym)}</strong> ={' '}
                  <strong>{activePlan.gymMonthsCovered}</strong> meses Gym).{' '}
                  {activePlan.fridayAfternoonFree ? 'Viernes tarde 100% libre.' : 'Viernes tarde ocupado.'}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0 font-medium">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Bloques</span>
            <span className="font-bold text-slate-900 dark:text-white">{schedule.length} Bloques</span>
          </div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase block">Créditos</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {scenario === '2026_2_official' ? '13 Créditos' : `${activePlan.totalCredits} Créditos`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
