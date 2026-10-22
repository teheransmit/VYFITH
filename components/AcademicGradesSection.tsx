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

  const currentGPA = calculateSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

  const toggleExpand = (id: string) => {
    setExpandedCourse((prev) => (prev === id ? null : id));
  };

  return (
    <section id="academic-grades-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
              SIGAA Oficial UPB — Campus Montería
            </span>
            <span className="text-xs font-mono text-slate-500 font-medium">
              ID: {initialAcademicData.studentId} • {initialAcademicData.program}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Control de Materias & Metas del Último Corte (2026-20)
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Auditoría en tiempo real de calificaciones, avance porcentual por materia y cálculo matemático exacto de la nota necesaria para aprobar en el examen o corte final.
          </p>
        </div>

        {/* Badge Promedio Ponderado */}
        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
              Promedio Ponderado Semestral
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{currentGPA.toFixed(2)}</span>
              <span className="text-xs font-medium text-slate-500">/ 5.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Período Académico</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">{initialAcademicData.period}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Créditos Inscritos</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">{totalCredits} Créditos</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Materias Activas</span>
          <div className="text-base font-bold text-slate-900 mt-0.5">{courses.length} Asignaturas</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Materia Foco Prioritaria</span>
          <div className="text-base font-bold text-amber-600 mt-0.5">Análisis de Estructuras</div>
        </div>
      </div>

      {/* Alerta Estratégica Académica */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-blue-50/80 border border-blue-200/80 flex items-start gap-3">
        <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-800 leading-relaxed">
          <strong>Diagnóstico Estratégico de Exámenes Finales:</strong> En <strong>Análisis de Estructuras</strong>, con el <strong>3.70</strong> del Avance 5 tu acumulado sube a <strong>2.11 / 5.00</strong> (70% evaluado). <strong>Necesitas 2.97 (un 3.0 pelado) en el Examen Final (30%)</strong> para pasar la materia y habilitar Concreto I. En <strong>Mecánica de Suelos</strong> la tienes casi aprobada con 2.45 acumulados (solo requieres 1.53 en lo restante).
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
                  : 'border-slate-200 bg-white hover:border-slate-300'
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
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
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
