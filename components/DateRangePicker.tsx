'use client';

import React from 'react';
import { Calendar as CalendarIcon, Clock, Check } from 'lucide-react';

export type DateRangeDays = 7 | 30 | 90;

interface DateRangePickerProps {
  selectedRange: DateRangeDays;
  onRangeChange: (days: DateRangeDays) => void;
  startDateStr?: string;
  endDateStr?: string;
  className?: string;
}

const PRESETS: { label: string; days: DateRangeDays; description: string }[] = [
  { label: 'Últimos 7 días', days: 7, description: 'Semana en curso y deltas recientes' },
  { label: 'Últimos 30 días', days: 30, description: 'Mes analítico y tendencias de fatiga' },
  { label: 'Últimos 90 días', days: 90, description: 'Trimestre consolidado y progreso' },
];

export default function DateRangePicker({
  selectedRange,
  onRangeChange,
  startDateStr,
  endDateStr,
  className = '',
}: DateRangePickerProps) {
  return (
    <div
      className={`bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${className}`}
      role="region"
      aria-label="Filtro de rango temporal del dashboard"
    >
      {/* Información del Período Activo */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/80 shrink-0">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 tracking-tight">
              Filtro Temporal del Dashboard
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-100">
              <Clock className="w-3 h-3" />
              {selectedRange} días seleccionados
            </span>
          </div>
          {startDateStr && endDateStr ? (
            <p className="text-xs text-slate-500 font-mono mt-0.5" suppressHydrationWarning>
              {startDateStr} — {endDateStr}
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5" suppressHydrationWarning>
              Correlación cronológica entre FHIR, Hevy y Open Banking
            </p>
          )}
        </div>
      </div>

      {/* Selector de Rangos (7, 30, 90 días) */}
      <div className="flex items-center bg-slate-100/90 p-1 rounded-xl self-start md:self-auto gap-1">
        {PRESETS.map((preset) => {
          const isSelected = selectedRange === preset.days;
          return (
            <button
              key={preset.days}
              type="button"
              onClick={() => onRangeChange(preset.days)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-white text-indigo-700 shadow-xs font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
              title={preset.description}
              aria-pressed={isSelected}
            >
              {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
              <span>{preset.days} días</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
