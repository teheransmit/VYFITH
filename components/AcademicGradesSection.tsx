'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  AlertTriangle,
  CheckCircle2,
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
} from 'lucide-react';
import {
  initialAcademicData,
  CourseGrade,
  calculateSemesterGPA,
} from '@/lib/academicStore';

type AcademicViewTab = 'current_2026' | 'capp_bags' | 'kardex_history' | 'offer_finances_2027';

export default function AcademicGradesSection() {
  const [courses] = useState<CourseGrade[]>(initialAcademicData.courses);
  const [expandedCourse, setExpandedCourse] = useState<string | null>('c-estructuras');
  const [activeTab, setActiveTab] = useState<AcademicViewTab>('current_2026');

  const [simulatedFinalScore, setSimulatedFinalScore] = useState<number>(3.00);
  const [simulatedCredits2027, setSimulatedCredits2027] = useState<number>(13);

  const currentGPA = calculateSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

  // Simulación dinámica de nota final de Análisis de Estructuras (acumulado 2.47 + 40% restante)
  const simulatedEstructurasGrade = Math.min(5.00, Math.round((2.47 + (simulatedFinalScore * 0.40)) * 100) / 100);
  const simulatedGPA = Math.round(((3.93 * 80 + (simulatedEstructurasGrade - 4.10) * 2) / 80) * 100) / 100;

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
            {initialAcademicData.creditsApprovedHistory} Aprobados + {totalCredits} Curso = 93 / {initialAcademicData.creditsRequiredTotal} cr
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Materias Cerradas 100% (2026-2)</span>
          <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            2 / 5 Aprobadas (Vías II 4.03 • Presup. 3.63)
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nivel de Inglés (Lengua Extranjera)</span>
          <div className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
            9 / 12 Niveles (Upper Interm. 4.00 ✅)
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Foco Crítico de Cierre</span>
          <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
            Estructuras (2.97) • Hidrología (3.01)
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
          <span>2. Auditoría CAPP, Bolsas & Inglés (93/142 cr)</span>
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
          {/* Simulador Interactivo de Metas GPA */}
          <div className="mb-6 p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Simulador Dinámico de Examen Final (Análisis de Estructuras 30%)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Con el <strong>3.70 asentado en el Avance 5 (15%)</strong>, ya tienes <strong>2.11 / 5.00</strong> acumulados. Desliza para simular tu Examen Final.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
                  PGA Global Proyectado: {simulatedGPA.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center pt-2">
              <div className="md:col-span-8 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-700 dark:text-slate-300">
                    Examen Final Análisis de Estructuras: <strong className="text-amber-600 dark:text-amber-400">{simulatedFinalScore.toFixed(2)} / 5.00</strong>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Meta Aprobatoria: 2.97</span>
                </div>
                <input
                  type="range"
                  min="1.00"
                  max="5.00"
                  step="0.05"
                  value={simulatedFinalScore}
                  onChange={(e) => setSimulatedFinalScore(parseFloat(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1.00 (Mínimo)</span>
                  <span>2.97 (Aprobación)</span>
                  <span>4.00 (Sobresaliente)</span>
                  <span>5.00 (Perfecto)</span>
                </div>
              </div>

              <div className="md:col-span-4 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Nota Final Materia
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {simulatedEstructurasGrade.toFixed(2)}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                  simulatedEstructurasGrade >= 3.00
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {simulatedEstructurasGrade >= 3.00 ? '✅ Habilita Concreto I (NRC 13826)' : '⚠️ No aprueba (Meta: 3.00)'}
                </span>
              </div>
            </div>
          </div>

          {/* Alerta Estratégica Académica */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-blue-50/50 to-indigo-50/80 dark:from-emerald-950/40 dark:via-blue-950/40 dark:to-indigo-950/40 border border-emerald-200/80 dark:border-emerald-900/60 flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
              <strong>Estado Oficial Extraído de SIGAA (`202620`):</strong> ¡Felicidades! Ya tienes <strong>2 materias 100% liquidadas y aprobadas</strong> en sistema: <strong>Vías II con 4.03 definitiva</strong> (desbloqueando Transporte `NRC 22223`) y <strong>Programación y Presupuesto con 3.63 definitiva</strong> (tras tu 4.00 en el Examen Final). En <strong>Mecánica de Suelos</strong> acumulas <strong>2.55 / 5.00</strong> (74% evaluado, solo necesitas <strong>1.73</strong> en el 26% restante). Tus dos frentes estratégicos finales son <strong>Análisis de Estructuras</strong> (necesitas <strong>2.97</strong> en el Examen Final del 30%) y <strong>Fundamentos de Hidrología</strong> (ya asentado el 3.00 de Proyecto de Aula para <strong>1.80 / 5.00</strong> al 60%, requiriendo <strong>3.01</strong> en el 40% restante).
            </div>
          </div>

          {/* Lista Interactiva de Asignaturas */}
          <div className="space-y-4">
            {courses.map((c) => {
              const isExpanded = expandedCourse === c.id;
              const isCritical = c.id === 'c-estructuras';

              return (
                <div
                  key={c.id}
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isCritical
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
                          c.status === 'passed'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : c.status === 'warning'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {c.status === 'passed' ? (
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
                                c.evaluatedPercent === 100
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
                      <div className="text-left md:text-right bg-slate-50 dark:bg-slate-800/90 px-3.5 py-2 rounded-xl border border-slate-100 dark:border-slate-700">
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                          {c.evaluatedPercent === 100 ? 'Definitiva SIGAA' : 'Para Pasar (3.0)'}
                        </span>
                        <div className="text-sm font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                          <Target className="w-3.5 h-3.5" />
                          <span>
                            {c.evaluatedPercent === 100 ? `${c.currentAverage.toFixed(2)} ✅` : c.neededForPassing.toFixed(2)}
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
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex flex-col lg:flex-row lg:items-center justify-between gap-2">
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
                  80.0 créditos aprobados en cárdex + 6.0 créditos recién aprobados en 2026-2 (Vías II + Presupuesto) + 7.0 créditos en cierre final = <strong>93.0 / 142.0 créditos (65.5% de la carrera)</strong>.
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-600 text-white self-start md:self-center">
                93.0 / 142.0 Créditos (65.5%)
              </span>
            </div>
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: '60.5%' }} title="86 créditos aprobados (80 cárdex + 6 cerrados 2026-2)" />
              <div className="h-full bg-blue-500" style={{ width: '5.0%' }} title="7 créditos en rectas finales 2026-2" />
            </div>
            <div className="flex items-center gap-4 mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> 86 cr Aprobados (80 Cárdex + Vías II + Presupuesto)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> 7 cr En Exámenes Finales (Suelos, Estructuras, Hidrología)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block" /> 49 cr Restantes (7° a 10° Semestre)</span>
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

              <div className="flex items-center gap-2">
                {[11, 13, 15, 16].map((cr) => (
                  <button
                    key={cr}
                    onClick={() => setSimulatedCredits2027(cr)}
                    className={`cursor-pointer px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      simulatedCredits2027 === cr
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
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Catálogo Verificado de Secciones `202710` (Pregrado) y `202750` (Inglés Oculto)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {initialAcademicData.offer2027.map((item) => (
                <div
                  key={item.nrc}
                  className={`p-4 rounded-2xl border ${
                    item.isZeroCreditTrap
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                      : item.period === '202750'
                      ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-900 dark:bg-slate-700 text-white">
                        {item.nrc}
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        Periodo {item.period} • {item.code}
                      </span>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        item.isZeroCreditTrap
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {item.credits} Créditos • Cupos: {item.seatsAvailable}/{item.seatsTotal}
                    </span>
                  </div>

                  <h5 className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    <strong>Horario:</strong> {item.schedule} ({item.classroom}) • {item.professor}
                  </p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {item.bagFulfilled}
                  </p>
                  {item.bypassNote && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                      🔑 {item.bypassNote}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
