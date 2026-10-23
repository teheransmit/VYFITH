'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  Award,
  Sparkles,
  FileText,
  BookmarkCheck,
  TrendingUp,
} from 'lucide-react';
import AcademicGradesSection from './AcademicGradesSection';
import ScientificNotesSection from './ScientificNotesSection';

export default function UnifiedAcademicSection() {
  const [viewType, setViewType] = useState<'combined' | 'grades' | 'science'>('combined');

  return (
    <section id="unified-academic-section" className="space-y-6 animate-fadeIn">
      {/* 1. HEADER INTEGRADO & SELECTOR DE MODO */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-slate-900 via-amber-950/80 to-slate-900 border border-amber-900/40 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>UPB Montería • Dimensión Académica & Científica Unificada</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Academia, Notas & Literatura Científica
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Consolidación del rendimiento universitario: control de calificaciones oficiales <strong>SIGAA UPB (6.° Semestre)</strong>,
              cálculo de metas para parciales finales y repositorio de <strong>artículos y literatura científica</strong> (OpenAlex / arXiv).
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-amber-200/90 font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/20">
                ID: 000533630
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/20">
                Periodo 2026-20
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-amber-500/20">
                Línea: Estructuras & Hidroinformática
              </span>
            </div>
          </div>

          {/* Sub-Selector de Vista */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-amber-500/30 p-2 shrink-0 shadow-lg flex flex-col sm:flex-row items-center gap-1.5 self-start lg:self-center">
            <button
              onClick={() => setViewType('combined')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewType === 'combined'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Vista Integral</span>
            </button>
            <button
              onClick={() => setViewType('grades')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewType === 'grades'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Notas Semestre (SIGAA)</span>
            </button>
            <button
              onClick={() => setViewType('science')}
              className={`cursor-pointer w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                viewType === 'science'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Notas & Referencias</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. RENDERIZADO SEGÚN EL MODO ELEGIDO */}
      {viewType === 'combined' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Bloque 1: Calificaciones y Metas Semestrales */}
          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Bloque 1: Calificaciones Oficiales & Metas de Parciales (SIGAA UPB)</span>
              </span>
            </div>
            <AcademicGradesSection />
          </div>

          {/* Bloque 2: Literatura y Referencias Científicas */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="mb-4 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950/80 text-violet-900 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                <span>Bloque 2: Repositorio de Literatura y Papers Científicos (OpenAlex)</span>
              </span>
            </div>
            <ScientificNotesSection />
          </div>
        </div>
      )}

      {viewType === 'grades' && (
        <div className="animate-fadeIn">
          <AcademicGradesSection />
        </div>
      )}

      {viewType === 'science' && (
        <div className="animate-fadeIn">
          <ScientificNotesSection />
        </div>
      )}
    </section>
  );
}
