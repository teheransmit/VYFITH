'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Target,
  ShieldCheck,
  Wallet,
  Dumbbell,
  Layers,
  Globe2,
  UserCheck,
  History,
  Compass,
  FlaskConical,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import {
  initialAcademicData,
  CourseGrade,
  calculateSemesterGPA,
} from '@/lib/academicStore';
import {
  TrackedCourseId,
  CourseOverrideMode,
} from '@/lib/academicReactiveEngine';
import { useAcademicReactiveState } from '@/lib/useAcademicReactiveState';
import { DashboardTab } from '@/lib/navigation';

type AcademicViewTab = 'current_2026' | 'capp_bags' | 'kardex_history' | 'offer_finances_2027';

export default function AcademicGradesSection({
  onNavigate,
}: {
  onNavigate?: (tab: DashboardTab) => void;
}) {
  const [courses] = useState<CourseGrade[]>(initialAcademicData.courses);
  const [expandedCourse, setExpandedCourse] = useState<string | null>('c-suelos');
  const [activeTab, setActiveTab] = useState<AcademicViewTab>('current_2026');
  const [customSimulatedCredits, setCustomSimulatedCredits] = useState<number | null>(null);

  const {
    overrides,
    projection,
    setCourseResolution,
    toggleHomologateSuelosLab,
    resetAcademicOverrides,
  } = useAcademicReactiveState();

  const currentGPA = calculateSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

  const failedCourses = courses.filter(
    (c) => !projection.projectedCourseMap[c.id as TrackedCourseId]?.isPassingForPrereqs
  );
  const safeOrPassedCourses = courses.filter((c) => {
    const p = projection.projectedCourseMap[c.id as TrackedCourseId];
    return p?.effectiveOutcome === 'passed';
  });
  const awaitingDeliveryCourses = courses.filter((c) => {
    const p = projection.projectedCourseMap[c.id as TrackedCourseId];
    return p?.effectiveOutcome === 'projected_pass';
  });
  const safeCredits = safeOrPassedCourses.reduce((acc, c) => acc + c.credits, 0);
  const awaitingCredits = awaitingDeliveryCourses.reduce((acc, c) => acc + c.credits, 0);
  const failedCredits = failedCourses.reduce((acc, c) => acc + c.credits, 0);

  const simulatedCredits2027 =
    customSimulatedCredits ?? projection.schedule2027Real.totalCredits;

  // Cálculos financieros TBEA 95% 2027-1
  const fin = initialAcademicData.financialConfig2027;
  const gross2027 = simulatedCredits2027 * fin.grossCreditCost;
  const netCredits2027 = simulatedCredits2027 * fin.netCreditCost;
  const totalNetTuition2027 = netCredits2027 + fin.studentInsurance;
  const surplusForGym2027 = Math.max(0, fin.availableBudget - totalNetTuition2027);
  const gymMonthsCovered = (surplusForGym2027 / fin.gymMonthlyFee).toFixed(1);

  const toggleExpand = (id: string) => {
    setExpandedCourse((prev) => (prev === id ? null : id));
  };

  return (
    <section id="academic-grades-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              SIGAA Banner 9 Oficial UPB — Montería
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-3 h-3" />
              Holds: {initialAcademicData.holdsCount} • {initialAcademicData.tariffCategory}
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
              ID: {initialAcademicData.studentId} (PIDM: {initialAcademicData.pidm}) • Consejera: {initialAcademicData.advisor}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Suite Académica SIGAA, Auditoría CAPP, Cárdex & Proyección 2027-1
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-3xl mt-1">
            Sincronización oficial con SIGAA UPB (13 nov 2026): <strong>Programación y Presupuesto (4.40)</strong>, <strong>Hidrología (4.30)</strong>, <strong>Vías II (4.13)</strong>, <strong>Estructuras (4.10)</strong> y <strong>Mecánica de Suelos (2.50)</strong>; libro docente de asistencia (`BZPGLAAC`) y avance CAPP (80/142 cr aprobados, PGA 3.93).
          </p>
        </div>

        {/* Badge Promedio Ponderado */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 shrink-0">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              PGA Histórico / Semestral
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{initialAcademicData.gpa.toFixed(2)}</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                (2026-2: {currentGPA.toFixed(2)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Globales del Estudiante */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avance Plan CAPP 202010</span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            {initialAcademicData.creditsApprovedHistory} Aprobados + {totalCredits - failedCredits} Viables = {initialAcademicData.creditsApprovedHistory + totalCredits - failedCredits} / {initialAcademicData.creditsRequiredTotal} cr
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Aseguradas ≥ 3.00 (2026-2)</span>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {safeOrPassedCourses.length} / {courses.length} ({safeOrPassedCourses.map((c) => `${c.name.split(' ')[0]} ${c.accumulatedPoints.toFixed(2)}`).join(' • ')})
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nivel de Inglés (Lengua Extranjera)</span>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            9 / 12 Niveles (Upper Interm. 4.00 ✅)
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Pendientes / Repetición</span>
          <div className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
            {failedCourses.length > 0
              ? `${failedCourses.map((c) => `${c.name} (${c.accumulatedPoints.toFixed(2)} ❌)`).join(', ')}`
              : `${awaitingDeliveryCourses.length} por entregar notas`}
          </div>
        </div>
      </div>

      {/* Barra de Navegación Interna (4 Sub-Vistas de la Skill 2027) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('current_2026')}
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'current_2026'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. Notas & Asistencia 2026-2 (En Vivo)</span>
        </button>

        <button
          onClick={() => setActiveTab('capp_bags')}
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'capp_bags'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>
            2. Auditoría CAPP, Bolsas & Inglés ({initialAcademicData.creditsApprovedHistory + safeCredits + awaitingCredits}/{initialAcademicData.creditsRequiredTotal} cr)
          </span>
        </button>

        <button
          onClick={() => setActiveTab('kardex_history')}
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'kardex_history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>3. Sábana de Notas Histórica (Cárdex 2024-2026)</span>
        </button>

        <button
          onClick={() => setActiveTab('offer_finances_2027')}
          className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'offer_finances_2027'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>4. Oferta 2027-1, Bypasses & Finanzas TBEA 95%</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: NOTAS EN VIVO 2026-2 + LIBRO DE ASISTENCIA DOCENTE (BZPGLAAC)   */}
      {/* ===================================================================== */}
      {activeTab === 'current_2026' && (
        <>
          {/* Resumen Real SIGAA + Motor Reactivo de Homologación & Prerrequisitos */}
          <div className="mb-4 p-4 rounded-2xl bg-linear-to-r from-slate-50 via-blue-50/50 to-indigo-50/70 dark:from-slate-800/70 dark:via-blue-950/30 dark:to-indigo-950/30 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                <strong>Estado en SIGAA (`202620`) + Propagación Viva a Agenda 2027-1:</strong> Ya superan el mínimo de <strong>3.000</strong> en puntos acumulados:{' '}
                <strong>{safeOrPassedCourses.map((c) => `${c.name} (${c.accumulatedPoints.toFixed(2)}/5.00)`).join(' y ')}</strong>.
                {failedCourses.length > 0 && (
                  <>
                    {' '}No superan <strong>3.000</strong> (bloquean prerrequisitos y pasan a repetición en 2027-1):{' '}
                    <strong className="text-rose-600 dark:text-rose-400">
                      {failedCourses.map((c) => `${c.name} (${c.accumulatedPoints.toFixed(2)}/5.00)`).join(', ')}
                    </strong>.
                  </>
                )}
                {awaitingDeliveryCourses.length > 0 && (
                  <>
                    {' '}Pendientes de entrega final:{' '}
                    <strong>
                      {awaitingDeliveryCourses.map((c) => `${c.name} (${c.accumulatedPoints.toFixed(2)}/5.00 al ${c.evaluatedPercent}%)`).join(' y ')}
                    </strong>.
                  </>
                )}
              </div>
            </div>

            {/* Banner Homologación Lab Suelos + Link directo a Agenda */}
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800/70 p-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-300 shrink-0">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div className="text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Homologación Lab Suelos (`8825-0050`): Promedio {projection.suelosLabSummary.weightedAverage.toFixed(2)} ≥ 4.00
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Apto (Lab I {projection.suelosLabSummary.items[0]?.grade?.toFixed(2)} • II {projection.suelosLabSummary.items[1]?.grade?.toFixed(2)} • III {projection.suelosLabSummary.items[2]?.grade?.toFixed(2)})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {projection.homologationApplied
                      ? `Homologación ACTIVA: Solo cursas Teoría Mar/Jue 14:00 (B3). Se liberan Mié/Vie 14:00 (Lab 119) y encaja Ética NRC 22674 (${projection.schedule2027Real.totalCredits} cr totales).`
                      : projection.projectedCourseMap['c-suelos'].isPassingForPrereqs
                      ? 'Mecánica de Suelos simulada aprobada: habilita Cimentaciones (NRC 22225).'
                      : `Homologación DESACTIVADA: Agenda incluye Lab 119 Mié/Vie 14:00 (${projection.schedule2027Real.totalCredits} cr totales).`}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {!projection.projectedCourseMap['c-suelos'].isPassingForPrereqs && (
                  <button
                    type="button"
                    data-testid="grades-toggle-homologate-lab"
                    onClick={() => toggleHomologateSuelosLab()}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
                      overrides.homologateSuelosLab
                        ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {overrides.homologateSuelosLab ? 'Homologar Lab ✓ (Solo Teoría)' : 'Activar Homologación Lab'}
                  </button>
                )}
                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate('horario')}
                    className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors"
                  >
                    <span>Ver horario ajustado en Agenda 2027-1</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Lista Interactiva de Asignaturas */}
          <div className="space-y-4">
            {courses.map((c) => {
              const isExpanded = expandedCourse === c.id;
              const proj = projection.projectedCourseMap[c.id as TrackedCourseId];
              const isFailed = proj ? !proj.isPassingForPrereqs : c.status === 'failed';
              const isSafePassed = !isFailed && (proj?.effectiveOutcome === 'passed' || c.accumulatedPoints >= 3.0);
              const isCritical = c.id === 'c-estructuras' && !isFailed;
              const currentMode: CourseOverrideMode = overrides.courseStatuses[c.id as TrackedCourseId] ?? 'sigaa_auto';

              return (
                <div
                  key={c.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isFailed
                      ? 'border-rose-300 dark:border-rose-800 bg-rose-50/20 dark:bg-rose-950/15 shadow-xs'
                      : isCritical
                      ? 'border-amber-300 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Fila Principal de la Materia */}
                  <div
                    onClick={() => toggleExpand(c.id)}
                    className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
                          isFailed
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : isSafePassed
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : c.status === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {isFailed ? (
                          <XCircle className="w-5 h-5" />
                        ) : isSafePassed ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : c.status === 'warning' ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">{c.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {c.code} • {c.subjectCode}
                          </span>
                          <span className="text-xs font-medium text-slate-400">• {c.credits} Créditos</span>
                          {/* Badge de Asistencia BZPGLAAC */}
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.attendance.absences === 0
                                ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            }`}
                          >
                            <UserCheck className="w-3 h-3" />
                            {c.attendance.absences === 0
                              ? `Asistencia 100% (${c.attendance.attendedSessions}/${c.attendance.recordedSessions})`
                              : `${c.attendance.absences} Fallas (${c.attendance.absencePercentage}%)`}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-slate-600 dark:text-slate-300">{c.professor}</span>
                          <span>•</span>
                          <span>{c.linea}</span>
                        </div>
                      </div>
                    </div>

                    {/* Métricas a la Derecha */}
                    <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                      {/* Progreso Evaluado */}
                      <div className="text-left md:text-right">
                        <span className="text-[11px] font-medium text-slate-400 block">% Calificado</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isFailed
                                  ? 'bg-rose-500'
                                  : isSafePassed
                                  ? 'bg-emerald-500'
                                  : c.evaluatedPercent >= 60
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${c.evaluatedPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{c.evaluatedPercent}%</span>
                        </div>
                      </div>

                      {/* Acumulado Actual */}
                      <div className="text-left md:text-right">
                        <span className="text-[11px] font-medium text-slate-400 block">Puntos Ganados</span>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {c.accumulatedPoints.toFixed(2)}{' '}
                          <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                        </div>
                      </div>

                      {/* Meta para Pasar */}
                      <div
                        className={`text-left md:text-right px-3.5 py-2 rounded-xl border ${
                          isFailed
                            ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800'
                            : isSafePassed
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-50 dark:bg-slate-800/90 border-slate-100 dark:border-slate-700'
                        }`}
                      >
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          {c.evaluatedPercent === 100
                            ? isFailed
                              ? 'Reprobada (< 3.00)'
                              : 'Cerrada SIGAA'
                            : isSafePassed
                            ? 'Ya Asegurada (≥ 3.00)'
                            : 'Falta en Restante (3.0)'}
                        </span>
                        <div
                          className={`text-sm font-extrabold flex items-center gap-1 ${
                            isFailed
                              ? 'text-rose-600 dark:text-rose-400'
                              : isSafePassed
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          <Target className="w-3.5 h-3.5" />
                          <span>
                            {c.evaluatedPercent === 100
                              ? isFailed
                                ? `${c.accumulatedPoints.toFixed(2)} ❌ Repetir`
                                : `${c.currentAverage.toFixed(2)} ✅`
                              : isSafePassed
                              ? `Aprobada (${c.currentAverage.toFixed(2)} ✅)`
                              : c.neededForPassing.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Icono de Desplegar */}
                      <div className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Detalle Desplegable de Actividades */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span>Desglose de Calificaciones en SIGAA (`bzsksmrk`):</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">
                          Estado de evaluación: <strong>{c.remainingDescription}</strong>
                        </span>
                      </div>

                      {/* Tarjetas de Notas de la Materia */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-3.5">
                        {c.breakdown.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-xl border text-xs ${
                              item.status === 'graded'
                                ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                                : item.status === 'provisional'
                                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                                : 'bg-slate-100/70 dark:bg-slate-800/40 border-dashed border-slate-300 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            <div className="font-medium text-slate-600 dark:text-slate-300 truncate" title={item.name}>
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Peso: {(item.weight * 100).toFixed(0)}%
                            </div>
                            <div className="mt-1.5 font-bold text-sm">
                              {item.grade !== undefined ? (
                                <span
                                  className={
                                    item.grade >= 3.0
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-rose-600 dark:text-rose-400'
                                  }
                                >
                                  {item.grade.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-xs">Por calificar</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resumen & Diagnóstico + Libro de Asistencia */}
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                          <div>
                            <strong>Diagnóstico:</strong> {c.diagnostic}
                            {c.attendance.absences > 0 && (
                              <span className="block mt-1 text-rose-600 dark:text-rose-400 font-medium">
                                ⚠️ Libro de Asistencia (`BZPGLAAC`): {c.attendance.absences} fallas ({c.attendance.absenceHours}h de {c.attendance.totalHours}h) en fechas: {c.attendance.absenceDates.join(', ')}. Cero inasistencias adicionales permitidas.
                              </span>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            <span>Para 3.50: <strong>{c.neededFor35.toFixed(2)}</strong></span>
                            <span>•</span>
                            <span>Máxima posible: <strong>{c.maxPossible.toFixed(2)}</strong></span>
                          </div>
                        </div>

                        {/* Fila Reactiva de Impacto en Prerrequisitos y Horario 2027-1 */}
                        {proj && (
                          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {proj.blocksNextCourses.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-800">
                                  <Lock className="w-3 h-3" />
                                  Bloquea en 2027-1: {proj.blocksNextCourses.join(', ')}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Habilita en 2027-1: {proj.unlocksNextCourses.join(', ')}
                                </span>
                              )}
                              {proj.labSummary.hasLab && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
                                  <FlaskConical className="w-3 h-3" />
                                  Lab {proj.labSummary.weightedAverage.toFixed(2)} ≥ 4.00 ({proj.labSummary.homologationEligible ? 'Homologable' : 'No'})
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg self-start sm:self-center">
                              {(['sigaa_auto', 'passed', 'failed'] as CourseOverrideMode[]).map((modeOpt) => (
                                <button
                                  key={modeOpt}
                                  type="button"
                                  data-testid={`course-res-${c.id}-${modeOpt}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCourseResolution(c.id as TrackedCourseId, modeOpt);
                                  }}
                                  className={`cursor-pointer px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                                    currentMode === modeOpt
                                      ? modeOpt === 'failed'
                                        ? 'bg-rose-600 text-white'
                                        : modeOpt === 'passed'
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-900 dark:bg-indigo-600 text-white'
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {modeOpt === 'sigaa_auto'
                                    ? 'SIGAA Real'
                                    : modeOpt === 'passed'
                                    ? 'Simular ≥ 3.0'
                                    : 'Simular < 3.0'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: AUDITORÍA CAPP, BOLSAS CURRICULARES & PROGRESO DE INGLÉS       */}
      {/* ===================================================================== */}
      {activeTab === 'capp_bags' && (
        <div className="space-y-6">
          {/* Progreso Global CAPP */}
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/60">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Motor de Cumplimiento CAPP (`bwckcapp.P_Submit` — Plan `202010`)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {initialAcademicData.creditsApprovedHistory}.0 créditos aprobados en cárdex + {safeCredits}.0 créditos asegurados ≥ 3.00 ({safeOrPassedCourses.map((c) => c.name).join(' + ')}) + {awaitingCredits}.0 créditos esperando entrega final = <strong>{initialAcademicData.creditsApprovedHistory + safeCredits + awaitingCredits}.0 / {initialAcademicData.creditsRequiredTotal}.0 créditos</strong> ({failedCredits > 0 ? `${failedCredits}.0 cr a repetir por reprobación` : '0 cr reprobados'}).
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-600 text-white self-start md:self-center">
                {initialAcademicData.creditsApprovedHistory + safeCredits + awaitingCredits}.0 / {initialAcademicData.creditsRequiredTotal}.0 Créditos ({(((initialAcademicData.creditsApprovedHistory + safeCredits + awaitingCredits) / initialAcademicData.creditsRequiredTotal) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(((initialAcademicData.creditsApprovedHistory + safeCredits) / initialAcademicData.creditsRequiredTotal) * 100).toFixed(1)}%` }}
                title={`${initialAcademicData.creditsApprovedHistory + safeCredits} créditos aprobados/asegurados`}
              />
              <div
                className="h-full bg-blue-500"
                style={{ width: `${((awaitingCredits / initialAcademicData.creditsRequiredTotal) * 100).toFixed(1)}%` }}
                title={`${awaitingCredits} créditos esperando entrega de notas en SIGAA`}
              />
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {initialAcademicData.creditsApprovedHistory + safeCredits} cr Aprobados/Asegurados ({initialAcademicData.creditsApprovedHistory} Cárdex + {safeCredits} cr ≥ 3.00)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> {awaitingCredits} cr Esperando Entrega ({awaitingDeliveryCourses.map((c) => c.name).join(', ')})</span>
              {failedCredits > 0 && (
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> {failedCredits} cr Reprobados ({failedCourses.map((c) => c.name).join(', ')})</span>
              )}
            </div>
          </div>

          {/* Estado de Bolsas Curriculares */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Estado de Bolsas Curriculares CAPP (Humanidades, Emprendimiento, Optativas & Deporte)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {initialAcademicData.cappBags.map((bag) => (
                <div
                  key={bag.id}
                  className={`p-4 rounded-2xl border ${
                    bag.status === 'completed'
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {bag.category} • {bag.creditsRequired} cr
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        bag.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {bag.status === 'completed' ? '✅ Cumplida' : '⏳ Pendiente'}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{bag.name}</h5>
                  {bag.fulfilledBy && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1.5">
                      {bag.fulfilledBy}
                    </p>
                  )}
                  {bag.recommended2027 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <strong>Ruta 2027-1:</strong> {bag.recommended2027}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Escalera de Inglés (12 Niveles + Bypass 202750) */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Escalera Oficial de Lengua Extranjera (9 / 12 Niveles Completados — B2 Formativo)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Truco SIGAA (`skill-materias-2027-upb`): Los niveles 10 (`THRESHOLD`) y 11 (`LOW ADVANCED`) están ocultos bajo el periodo <strong>`202750` (2027 Semestre 1 Form Continua)</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {initialAcademicData.englishLevels.map((eng) => (
                <div
                  key={eng.level}
                  className={`p-3 rounded-xl border text-xs ${
                    eng.status === 'completed'
                      ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60'
                      : eng.status === 'available_202750'
                      ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                      : 'bg-slate-100/70 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                    <span>NIVEL {eng.level} • {eng.code}</span>
                    {eng.grade !== undefined && (
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{eng.grade.toFixed(2)} ✅</span>
                    )}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">{eng.name}</div>
                  {eng.nrc202750 && (
                    <div className="mt-1.5 text-[10px] text-blue-700 dark:text-blue-300 font-medium">
                      <div><strong>202750:</strong> {eng.nrc202750}</div>
                      <div>{eng.schedule202750}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SÁBANA DE NOTAS HISTÓRICA (CÁRDEX OFICIAL 2024-1 A 2026-1)     */}
      {/* ===================================================================== */}
      {activeTab === 'kardex_history' && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Sábana Histórica Oficial (`bwskotrn.P_ViewTran` — 80.0 Créditos Aprobados en 5 Semestres)
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Promedio Global Acumulado (PGA) sostenido sobre <strong>3.93 / 5.00</strong> con 5.00 perfecto en Ecuaciones Diferenciales y 4.80 en Ética General.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Ahorro TBEA Acumulado</span>
              <span className="text-base font-black text-emerald-800 dark:text-emerald-300">$48.729.050 COP</span>
            </div>
          </div>

          <div className="space-y-4">
            {initialAcademicData.historicalSemesters.map((sem) => (
              <div
                key={sem.periodCode}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 dark:bg-indigo-600 text-white">
                      Periodo {sem.periodCode}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">{sem.semesterLabel}</h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {sem.creditsEarned} Créditos Ganados
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      PGA Semestral: {sem.pga.toFixed(2)}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      Neto Pagado (5%): ${(sem.tuitionNetPaid).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {sem.courses.map((crs) => (
                    <div
                      key={crs.code}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">{crs.code}</span>
                          <span className="text-[10px] text-slate-400">• {crs.credits} cr</span>
                          {crs.bagTag && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                              {crs.bagTag}
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5" title={crs.name}>
                          {crs.name}
                        </div>
                      </div>
                      <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 shrink-0">
                        {crs.grade.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: OFERTA 2027-1, BYPASSES & SIMULADOR FINANCIERO TBEA 95% + GYM  */}
      {/* ===================================================================== */}
      {activeTab === 'offer_finances_2027' && (
        <div className="space-y-6">
          {/* Simulador Financiero TBEA 95% + Gimnasio UPB */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-50 to-amber-50/30 dark:from-slate-800/70 dark:to-amber-950/20 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500 text-white">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Simulador Financiero 2027-1 (Auxilio TBEA 95% Empleados + Gimnasio UPB)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Valor bruto por crédito: <strong>$575.000 COP</strong> → Neto a pagar (5%): <strong>$28.750 COP / crédito</strong> + Seguro estudiantil ($36.000 COP).
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomSimulatedCredits(null)}
                  className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    customSimulatedCredits === null
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Plan Reactivo ({projection.schedule2027Real.totalCredits} cr)
                </button>
                {[11, 12, 13, 15, 16].map((cr) => (
                  <button
                    type="button"
                    key={cr}
                    onClick={() => setCustomSimulatedCredits(cr)}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      customSimulatedCredits === cr
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {cr} cr
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Matrícula Bruta ({simulatedCredits2027} cr)</span>
                <div className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">
                  ${gross2027.toLocaleString('es-CO')} COP
                </div>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Auxilio TBEA 95%: -${(gross2027 * 0.95).toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Neto Matrícula + Seguro</span>
                <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                  ${totalNetTuition2027.toLocaleString('es-CO')} COP
                </div>
                <span className="text-[11px] text-slate-500">
                  (${netCredits2027.toLocaleString('es-CO')} cr + $36.000 seguro)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Sobrante (Presupuesto $500k)</span>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  +${surplusForGym2027.toLocaleString('es-CO')} COP
                </div>
                <span className="text-[11px] text-slate-500">
                  Disponible para Gimnasio UPB
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-amber-500" /> Cobertura Gimnasio UPB
                </span>
                <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  {gymMonthsCovered} Meses Cubiertos
                </div>
                <span className="text-[11px] text-slate-500">
                  Tarifa `TG01-1`: $51.685/mes ({fin.gymHistoricalSessionsPaid} pagos hist.)
                </span>
              </div>
            </div>
          </div>

          {/* Catálogo de Oferta 2027-1 y Bypasses */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Catálogo Reactivo `202710` & `202750` (Bloqueos y Homologación en Vivo)
              </h4>
              <button
                type="button"
                onClick={resetAcademicOverrides}
                className="cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Restaurar SIGAA
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {projection.offerCatalogWithStatus.map((item) => {
                const badgeMap = {
                  enrolled: {
                    label: '✅ En Plan 2027-1',
                    card: 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800',
                    pill: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                  },
                  blocked_prereq: {
                    label: '🔒 Bloqueada Prerrequisito',
                    card: 'bg-rose-50/50 dark:bg-rose-950/25 border-rose-300 dark:border-rose-800 opacity-90',
                    pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
                  },
                  conflict: {
                    label: '⚠️ Cruce de Horario',
                    card: 'bg-amber-50/50 dark:bg-amber-950/25 border-amber-300 dark:border-amber-800',
                    pill: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                  },
                  trap: {
                    label: '🚫 TRAMPA 0 CR',
                    card: 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800',
                    pill: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
                  },
                  available: {
                    label: 'Disponible',
                    card:
                      item.period === '202750'
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800',
                    pill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                  },
                }[item.reactiveStatus];

                return (
                  <div key={item.nrc} className={`p-4 rounded-2xl border ${badgeMap.card}`}>
                    <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 dark:bg-slate-700 text-white">
                          {item.nrc}
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          {item.period} • {item.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeMap.pill}`}>
                          {badgeMap.label}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {item.credits} cr
                        </span>
                      </div>
                    </div>

                    <h5 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <strong>Horario:</strong> {item.schedule} ({item.classroom}) • {item.professor}
                    </p>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-semibold mt-1">
                      {item.reactiveReason}
                    </p>
                    {item.bypassNote && (
                      <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                        🔑 {item.bypassNote}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
