'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  Award,
  Sparkles,
} from 'lucide-react';
import {
  initialAcademicData,
  CourseGrade,
  calculateCourseAverage,
  calculateSemesterGPA,
} from '@/lib/academicStore';

export default function AcademicGradesSection() {
  const [courses, setCourses] = useState<CourseGrade[]>(initialAcademicData.courses);

  const currentGPA = calculateSemesterGPA(courses);
  const totalCredits = courses.reduce((acc, c) => acc + c.credits, 0);

  const updateGrade = (id: string, field: 'corte1' | 'corte2' | 'corte3', value: number) => {
    const val = Math.max(0, Math.min(5, value));
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  return (
    <section id="academic-grades-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
              Gestión Universitaria & Calificaciones
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 5: Rendimiento Académico</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Notas del Semestre & Promedio Ponderado (GPA)
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Seguimiento de cortes evaluativos (30% - 30% - 40%), créditos matriculados y cálculo de promedio en tiempo real para optimizar tu carga mental con el entrenamiento y descanso.
          </p>
        </div>

        {/* Badge Promedio Ponderado */}
        <div className="flex items-center gap-4 bg-amber-50/70 border border-amber-200 rounded-2xl px-5 py-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">
              Promedio Semestral (GPA)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-amber-950">{currentGPA.toFixed(2)}</span>
              <span className="text-xs font-medium text-amber-700">/ 5.00</span>
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
          <span className="text-xs text-slate-500 font-medium">Estado Académico</span>
          <div className="text-base font-bold text-emerald-600 mt-0.5">Alto Rendimiento</div>
        </div>
      </div>

      {/* Correlación Académica & Salud */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 border border-amber-200/80 flex items-start gap-3">
        <div className="p-2 bg-amber-600 text-white rounded-xl shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-amber-950 leading-relaxed">
          <strong>Correlación IA (Sueño vs Rendimiento en Exámenes):</strong> Durante la semana previa al Corte 2, registrar <strong>&gt;7.5 horas de sueño</strong> promedio se correlacionó con un incremento de <strong>+0.5 puntos</strong> en asignaturas de alta carga cognitiva (Inteligencia Artificial y Optimización). No sacrifiques descanso antes de parciales.
        </div>
      </div>

      {/* Tabla de Asignaturas y Calificaciones */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Materia / Código</th>
              <th className="px-4 py-3.5 font-semibold text-center">Créditos</th>
              <th className="px-4 py-3.5 font-semibold text-center">Corte 1 (30%)</th>
              <th className="px-4 py-3.5 font-semibold text-center">Corte 2 (30%)</th>
              <th className="px-4 py-3.5 font-semibold text-center">Corte 3 (40%)</th>
              <th className="px-4 py-3.5 font-semibold text-center">Definitiva Actual</th>
              <th className="px-4 py-3.5 font-semibold text-center">Meta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.map((c) => {
              const currentDef = calculateCourseAverage(c);
              const isPassing = currentDef >= 3.0;

              return (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900">{c.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-400">{c.code}</span>
                      <span>•</span>
                      <span>{c.professor}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-center font-semibold text-slate-700">
                    {c.credits}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={c.corte1}
                      onChange={(e) => updateGrade(c.id, 'corte1', parseFloat(e.target.value) || 0)}
                      className="w-16 text-center py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={c.corte2}
                      onChange={(e) => updateGrade(c.id, 'corte2', parseFloat(e.target.value) || 0)}
                      className="w-16 text-center py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={c.corte3}
                      onChange={(e) => updateGrade(c.id, 'corte3', parseFloat(e.target.value) || 0)}
                      className="w-16 text-center py-1 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-indigo-500"
                    />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-xs ${
                        isPassing ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {currentDef.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="text-slate-500 font-semibold">{c.targetGrade.toFixed(1)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
