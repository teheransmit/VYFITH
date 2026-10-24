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
} from 'lucide-react';
import {
  initialAcademicData,
  CourseGrade,
  calculateSemesterGPA,
} from '@/lib/academicStore';

export default function AcademicGradesSection() {
  const [courses] = useState<CourseGrade[]>(initialAcademicData.courses);
  const [expandedCourse, setExpandedCourse] = useState<string | null>('c-estructuras');

  const [simulatedFinalScore, setSimulatedFinalScore] = useState<number>(3.00);
  const currentGPA = calculateSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

  // Simulación dinámica de nota final de Análisis de Estructuras (acumulado 2.11 + 30% restante)
  const simulatedEstructurasGrade = Math.min(5.00, Math.round((2.11 + (simulatedFinalScore * 0.30)) * 100) / 100);
  const simulatedGPA = Math.round(((3.93 * 65 + (simulatedEstructurasGrade - 3.01) * 2) / 65) * 100) / 100;

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
              SIGAA Oficial UPB — Campus Montería
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
              ID: {initialAcademicData.studentId} • {initialAcademicData.program}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Control de Materias & Metas del Último Corte (2026-20)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Auditoría en tiempo real de calificaciones, avance porcentual por materia y cálculo matemático exacto de la nota necesaria para aprobar en el examen o corte final.
          </p>
        </div>

        {/* Badge Promedio Ponderado */}
        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Promedio Ponderado Semestral
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{currentGPA.toFixed(2)}</span>
              <span className="text-xs font-medium text-slate-500">/ 5.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Período Académico</span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{initialAcademicData.period}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Créditos Inscritos</span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{totalCredits} Créditos</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Materias Activas</span>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">{courses.length} Asignaturas</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Materia Foco Prioritaria</span>
          <div className="text-base font-bold text-amber-600 mt-0.5">Análisis de Estructuras</div>
        </div>
      </div>

      {/* Simulador Interactivo de Metas GPA (Inspirado en nusmodifications/nusmods & mygpa) */}
      <div className="my-6 p-5 sm:p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Simulador Dinámico de Metas de Examen Final & GPA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desliza la nota hipotética del Examen Final de Análisis de Estructuras (30%) para proyectar tu promedio.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-3 py-1 rounded-xl border border-amber-200 dark:border-amber-800">
              PGA Proyectado: {simulatedGPA.toFixed(2)}
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
              {simulatedEstructurasGrade >= 3.00 ? '✅ Habilita Concreto I' : '⚠️ No aprueba (Meta: 3.00)'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerta Estratégica Académica */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 dark:from-blue-950/60 dark:via-indigo-950/50 dark:to-blue-950/60 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
          <strong>Diagnóstico Estratégico de Notas & Cortes Finales:</strong> En <strong>Programación y Presupuesto</strong> se asentó hoy un <strong>4.40 en el Quiz (30%)</strong> disparando tu acumulado a <strong>2.55 / 5.00</strong> (solo requieres <strong>1.30</strong> en lo restante para asegurar la materia). En <strong>Mecánica de Suelos</strong> se asentó el Examen II (1.00, 10%) situando tu acumulado en <strong>2.55 / 5.00</strong> (74% evaluado, requieres solo <strong>1.73</strong> en el 26% restante). En <strong>Vías II</strong> acumulas <strong>2.18 / 5.00</strong> (requieres <strong>2.36</strong>) y en <strong>Análisis de Estructuras</strong> acumulas <strong>2.11 / 5.00</strong> (requieres <strong>2.97</strong> en el Examen Final).
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
                  ? 'border-amber-300 bg-amber-50/20 shadow-xs'
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
                        ? 'bg-emerald-100 text-emerald-700'
                        : c.status === 'warning'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
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
                      <h3 className="font-bold text-slate-900 text-base">{c.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-600">
                        {c.code}
                      </span>
                      <span className="text-xs font-medium text-slate-400">• {c.credits} Créditos</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-600">{c.linea}</span>
                    </div>
                  </div>
                </div>

                {/* Métricas a la Derecha */}
                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {/* Progreso Evaluado */}
                  <div className="text-left md:text-right">
                    <span className="text-[11px] font-medium text-slate-400 block">% Calificado</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.evaluatedPercent >= 60 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${c.evaluatedPercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">{c.evaluatedPercent}%</span>
                    </div>
                  </div>

                  {/* Acumulado Actual */}
                  <div className="text-left md:text-right">
                    <span className="text-[11px] font-medium text-slate-400 block">Puntos Ganados</span>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {c.accumulatedPoints.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                    </div>
                  </div>

                  {/* Meta para Pasar */}
                  <div className="text-left md:text-right bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Para Pasar (3.0)
                    </span>
                    <div className="text-sm font-extrabold text-blue-700 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      <span>{c.neededForPassing.toFixed(2)}</span>
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
                  <div className="text-xs font-semibold text-slate-600 mb-2.5 flex items-center justify-between">
                    <span>Desglose de Calificaciones en SIGAA:</span>
                    <span className="text-slate-500 font-normal">
                      Pendiente por evaluar: <strong>{c.remainingDescription}</strong>
                    </span>
                  </div>

                  {/* Tarjetas de Notas de la Materia */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-3.5">
                    {c.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-xl border text-xs ${
                          item.status === 'graded'
                            ? 'bg-white border-slate-200'
                            : item.status === 'provisional'
                            ? 'bg-amber-50 border-amber-300'
                            : 'bg-slate-100/70 border-dashed border-slate-300 text-slate-400'
                        }`}
                      >
                        <div className="font-medium text-slate-600 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Peso: {(item.weight * 100).toFixed(0)}%
                        </div>
                        <div className="mt-1.5 font-bold text-sm">
                          {item.grade !== undefined ? (
                            <span
                              className={
                                item.grade >= 3.0
                                  ? 'text-emerald-700'
                                  : 'text-rose-600'
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

                  {/* Resumen & Diagnóstico de la Materia */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <strong>Diagnóstico:</strong> {c.diagnostic}
                    </div>
                    <div className="shrink-0 flex items-center gap-3 text-[11px] text-slate-500 font-medium">
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
    </section>
  );
}
