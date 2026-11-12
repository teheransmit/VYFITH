'use client';

import React, { useState, useMemo } from 'react';
import { Flame, Dumbbell, Calendar, Info, Sparkles, Check, ChevronRight, Activity } from 'lucide-react';

export interface MuscleWorkload {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'legs';
  sets: number;
  volumeKg: number;
  lastExercise?: string;
  view: 'front' | 'back' | 'both';
}

interface HevyBodyDistributionProps {
  className?: string;
  initialMode?: 'week' | 'chest_back' | 'legs' | 'shoulders_arms';
  onSelectMuscle?: (muscleId: string) => void;
}

export default function HevyBodyDistribution({
  className = '',
  initialMode = 'chest_back',
  onSelectMuscle,
}: HevyBodyDistributionProps) {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('chest');
  const [activeDayIndex, setActiveDayIndex] = useState<number>(5); // Viernes 27 por defecto
  const [activePreset, setActivePreset] = useState<'week' | 'chest_back' | 'legs' | 'shoulders_arms'>(initialMode);

  // Días de la semana estilo Hevy
  const weekDays = [
    { label: 'D', day: 22, hasWorkout: false, title: 'Descanso' },
    { label: 'L', day: 23, hasWorkout: true, title: 'Pierna & Femorales (UPB)' },
    { label: 'M', day: 24, hasWorkout: false, title: 'Descanso / Paseos' },
    { label: 'M', day: 25, hasWorkout: true, title: 'Vertical Torso & Hombros' },
    { label: 'J', day: 26, hasWorkout: false, title: 'Descanso activo' },
    { label: 'V', day: 27, hasWorkout: true, title: 'Horizontal Torso (Chest & Back)' },
    { label: 'S', day: 28, hasWorkout: false, title: 'Recuperación' },
  ];

  // Presets de activación muscular basados en los entrenamientos reales de Hevy de Santiago
  const muscleData = useMemo(() => {
    const base: Record<string, MuscleWorkload> = {
      // Pectorales
      chest: { id: 'chest', name: 'Pectorales (Pecho)', category: 'chest', sets: 16, volumeKg: 2850, lastExercise: 'Press Banca con Barra 65 kg', view: 'front' },
      
      // Espalda
      lats: { id: 'lats', name: 'Dorsales (V-Taper)', category: 'back', sets: 14, volumeKg: 2420, lastExercise: 'Jalón al Pecho Polea 75 kg', view: 'back' },
      traps: { id: 'traps', name: 'Trapecios (Espalda Alta)', category: 'back', sets: 8, volumeKg: 1350, lastExercise: 'Remo con Barra 60 kg', view: 'back' },
      lower_back: { id: 'lower_back', name: 'Erectores Espinales (Lumbar)', category: 'back', sets: 6, volumeKg: 1100, lastExercise: 'Hiperextensiones Lumbar', view: 'back' },

      // Hombros
      deltoids_front: { id: 'deltoids_front', name: 'Deltoides Anterior', category: 'shoulders', sets: 10, volumeKg: 1200, lastExercise: 'Press Militar Mancuernas 22 kg', view: 'front' },
      deltoids_lateral: { id: 'deltoids_lateral', name: 'Deltoides Lateral', category: 'shoulders', sets: 12, volumeKg: 950, lastExercise: 'Elevaciones Laterales en Polea', view: 'both' },
      deltoids_rear: { id: 'deltoids_rear', name: 'Deltoides Posterior', category: 'shoulders', sets: 8, volumeKg: 780, lastExercise: 'Face Pulls en Cuerda', view: 'back' },

      // Brazos
      biceps: { id: 'biceps', name: 'Bíceps (Braquial)', category: 'arms', sets: 10, volumeKg: 1150, lastExercise: 'Curl Inclinado Mancuernas 14 kg', view: 'front' },
      triceps: { id: 'triceps', name: 'Tríceps (Lateral & Larga)', category: 'arms', sets: 14, volumeKg: 1680, lastExercise: 'Press Francés 30 kg', view: 'back' },
      forearms: { id: 'forearms', name: 'Antebrazos & Agarre', category: 'arms', sets: 8, volumeKg: 890, lastExercise: 'Paseo del Granjero con Mancuernas', view: 'both' },

      // Core
      abs: { id: 'abs', name: 'Recto Abdominal & Oblicuos', category: 'core', sets: 10, volumeKg: 650, lastExercise: 'Elevaciones de Piernas Colgado', view: 'front' },

      // Piernas
      quads: { id: 'quads', name: 'Cuádriceps', category: 'legs', sets: 14, volumeKg: 3200, lastExercise: 'Sentadilla Profunda 80 kg & Prensa 45°', view: 'front' },
      hamstrings: { id: 'hamstrings', name: 'Isquiotibiales (Femorales)', category: 'legs', sets: 10, volumeKg: 2100, lastExercise: 'Peso Muerto Rumano 70 kg', view: 'back' },
      glutes: { id: 'glutes', name: 'Glúteos', category: 'legs', sets: 8, volumeKg: 1800, lastExercise: 'Hip Thrust con Barra 90 kg', view: 'back' },
      calves: { id: 'calves', name: 'Pantorrillas (Gemelos)', category: 'legs', sets: 8, volumeKg: 950, lastExercise: 'Elevación de Talones en Máquina 60 kg', view: 'both' },
    };

    if (activePreset === 'chest_back') {
      return {
        ...base,
        quads: { ...base.quads, sets: 0, volumeKg: 0 },
        hamstrings: { ...base.hamstrings, sets: 0, volumeKg: 0 },
        glutes: { ...base.glutes, sets: 0, volumeKg: 0 },
        calves: { ...base.calves, sets: 0, volumeKg: 0 },
      };
    } else if (activePreset === 'legs') {
      return {
        ...base,
        chest: { ...base.chest, sets: 0, volumeKg: 0 },
        lats: { ...base.lats, sets: 0, volumeKg: 0 },
        traps: { ...base.traps, sets: 0, volumeKg: 0 },
        deltoids_front: { ...base.deltoids_front, sets: 0, volumeKg: 0 },
        deltoids_lateral: { ...base.deltoids_lateral, sets: 0, volumeKg: 0 },
        deltoids_rear: { ...base.deltoids_rear, sets: 0, volumeKg: 0 },
        biceps: { ...base.biceps, sets: 0, volumeKg: 0 },
        triceps: { ...base.triceps, sets: 0, volumeKg: 0 },
        forearms: { ...base.forearms, sets: 0, volumeKg: 0 },
      };
    } else if (activePreset === 'shoulders_arms') {
      return {
        ...base,
        chest: { ...base.chest, sets: 0, volumeKg: 0 },
        lats: { ...base.lats, sets: 0, volumeKg: 0 },
        quads: { ...base.quads, sets: 0, volumeKg: 0 },
        hamstrings: { ...base.hamstrings, sets: 0, volumeKg: 0 },
        glutes: { ...base.glutes, sets: 0, volumeKg: 0 },
        calves: { ...base.calves, sets: 0, volumeKg: 0 },
      };
    }

    return base;
  }, [activePreset]);

  const isWorked = (id: string) => {
    return (muscleData[id]?.sets || 0) > 0;
  };

  const handleSelect = (id: string) => {
    setSelectedMuscle(id);
    onSelectMuscle?.(id);
  };

  const currentMuscleInfo = selectedMuscle ? muscleData[selectedMuscle] : null;

  return (
    <div
      style={{ width: '100%', boxSizing: 'border-box' }}
      className={`bg-[#0B0B0E] border border-[#262630] rounded-3xl p-5 sm:p-7 text-white space-y-6 shadow-2xl relative overflow-hidden ${className}`}
    >
      {/* 1. HEADER OFICIAL HEVY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262630]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00A2FF] flex items-center justify-center shadow-lg shadow-[#0084FF]/25 font-black text-white text-lg tracking-tighter shrink-0">
            ∾
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">HEVY</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0084FF]/20 text-[#38BDF8] border border-[#0084FF]/40 font-mono font-bold">
                PRO ENGINE
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Distribución Corporal
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {activePreset === 'chest_back' && 'Último entrenamiento • 27 Oct 2026 (Horizontal Torso)'}
              {activePreset === 'legs' && 'Entrenamiento Piernas & Femorales • 23 Oct 2026'}
              {activePreset === 'shoulders_arms' && 'Entrenamiento Vertical Torso • 25 Oct 2026'}
              {activePreset === 'week' && 'Volumen Semanal Acumulado (11 - 17 Feb 2024 / Oct 2026)'}
            </p>
          </div>
        </div>

        {/* Perfil de Usuario Santiago */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-white block">Santiago Smit</span>
            <span className="text-[11px] text-slate-400 font-mono">@teheransmit</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#0084FF] text-white font-black flex items-center justify-center text-sm shadow-md border border-[#38BDF8]/40 shrink-0">
            S
          </div>
        </div>
      </div>

      {/* 2. BOTONES PRESETS DE SESIÓN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#16161D] rounded-xl border border-[#262630]">
          <button
            onClick={() => setActivePreset('chest_back')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'chest_back'
                ? 'bg-[#0084FF] text-white shadow-md shadow-[#0084FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Horizontal Torso (Chest & Back)
          </button>
          <button
            onClick={() => setActivePreset('legs')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'legs'
                ? 'bg-[#0084FF] text-white shadow-md shadow-[#0084FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Piernas & Core
          </button>
          <button
            onClick={() => setActivePreset('shoulders_arms')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'shoulders_arms'
                ? 'bg-[#0084FF] text-white shadow-md shadow-[#0084FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Hombros & Brazos
          </button>
          <button
            onClick={() => setActivePreset('week')}
            className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold transition-all ${
              activePreset === 'week'
                ? 'bg-[#0084FF] text-white shadow-md shadow-[#0084FF]/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Semana Completa
          </button>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0084FF] shadow-sm shadow-[#0084FF]" />
            <span>Músculo Estimulado</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#262630]" />
            <span>Sin trabajar</span>
          </span>
        </div>
      </div>

      {/* 3. CONTENEDOR PRINCIPAL: FIGURAS ANATÓMICAS (CENTRADAS) + PANEL AUDITOR */}
      <div
        style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '1.5rem', width: '100%', alignItems: 'stretch' }}
      >
        {/* LIENZO SVG ANATÓMICO (FRONTAL Y ESPALDA) */}
        <div
          style={{ flex: '1 1 520px', minWidth: '320px', width: '100%' }}
          className="bg-[#111116] border border-[#262630] rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center relative shadow-inner"
        >
          <svg
            viewBox="0 0 500 520"
            style={{ width: '100%', maxWidth: '520px', height: 'auto', minHeight: '440px', display: 'block' }}
            className="select-none transition-all drop-shadow-xl"
          >
            <defs>
              {/* Degradado Azul Hevy Oficial */}
              <linearGradient id="hevyBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="40%" stopColor="#0084FF" />
                <stop offset="100%" stopColor="#0055D4" />
              </linearGradient>

              {/* Degradado Azul Seleccionado */}
              <linearGradient id="hevyBlueSelected" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="50%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1E40AF" />
              </linearGradient>

              {/* Degradado Gris Anatómico (Sin Trabajar) */}
              <linearGradient id="muscleIdleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2A2A36" />
                <stop offset="100%" stopColor="#1E1E26" />
              </linearGradient>

              {/* Filtro Resplandor Neón Hevy */}
              <filter id="hevyGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* ============================================================== */}
            {/* FIGURA FRONTAL (Anterior View, Centro X = 135)               */}
            {/* ============================================================== */}
            <g id="figure-front" transform="translate(10, 10)">
              <text x="135" y="24" fill="#64748B" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace" letterSpacing="1.5">
                VISTA ANTERIOR (FRONTAL)
              </text>

              {/* Cabeza & Rostro */}
              <ellipse cx="135" cy="52" rx="14" ry="18" fill="#1C1C24" stroke="#333342" strokeWidth="1.2" />
              <path d="M 130 68 Q 135 73 140 68" stroke="#444455" strokeWidth="1" fill="none" />
              {/* Cuello */}
              <path d="M 127 68 L 126 84 L 144 84 L 143 68 Z" fill="#242430" stroke="#333344" strokeWidth="1" />
              {/* Clavículas */}
              <path d="M 102 85 Q 120 88 135 87 Q 150 88 168 85" stroke="#3F3F52" strokeWidth="1.8" fill="none" />

              {/* PECTORALES */}
              <g id="front-chest" onClick={() => handleSelect('chest')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 134 88 L 105 88 Q 94 94 94 108 Q 96 124 116 128 Q 132 130 134 118 Z"
                  fill={isWorked('chest') ? (selectedMuscle === 'chest' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('chest') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                  filter={isWorked('chest') ? 'url(#hevyGlow)' : undefined}
                />
                <path
                  d="M 136 88 L 165 88 Q 176 94 176 108 Q 174 124 154 128 Q 138 130 136 118 Z"
                  fill={isWorked('chest') ? (selectedMuscle === 'chest' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('chest') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                  filter={isWorked('chest') ? 'url(#hevyGlow)' : undefined}
                />
                <path d="M 108 96 Q 120 98 132 98" stroke={isWorked('chest') ? '#93C5FD' : '#444455'} strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d="M 104 106 Q 118 109 133 108" stroke={isWorked('chest') ? '#93C5FD' : '#444455'} strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d="M 162 96 Q 150 98 138 98" stroke={isWorked('chest') ? '#93C5FD' : '#444455'} strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d="M 166 106 Q 152 109 137 108" stroke={isWorked('chest') ? '#93C5FD' : '#444455'} strokeWidth="0.8" fill="none" opacity="0.6" />
              </g>

              {/* DELTOIDES FRONTALES */}
              <g id="front-deltoids" onClick={() => handleSelect('deltoids_front')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 104 87 Q 92 86 82 96 Q 74 108 77 125 Q 84 135 91 131 Q 95 118 94 108 Q 96 95 104 87 Z"
                  fill={isWorked('deltoids_front') ? (selectedMuscle === 'deltoids_front' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('deltoids_front') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 166 87 Q 178 86 188 96 Q 196 108 193 125 Q 186 135 179 131 Q 175 118 176 108 Q 174 95 166 87 Z"
                  fill={isWorked('deltoids_front') ? (selectedMuscle === 'deltoids_front' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('deltoids_front') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* BÍCEPS */}
              <g id="front-biceps" onClick={() => handleSelect('biceps')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 89 130 Q 77 138 78 158 Q 80 174 91 176 Q 98 174 99 158 Q 97 140 91 130 Z"
                  fill={isWorked('biceps') ? (selectedMuscle === 'biceps' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('biceps') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 181 130 Q 193 138 192 158 Q 190 174 179 176 Q 172 174 171 158 Q 173 140 179 130 Z"
                  fill={isWorked('biceps') ? (selectedMuscle === 'biceps' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('biceps') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* ANTEBRAZOS (FRONTAL) */}
              <g id="front-forearms" onClick={() => handleSelect('forearms')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 87 178 Q 72 190 73 216 Q 74 238 80 248 L 87 248 Q 93 234 96 210 Q 98 188 92 178 Z"
                  fill={isWorked('forearms') ? (selectedMuscle === 'forearms' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('forearms') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.4"
                />
                <path
                  d="M 183 178 Q 198 190 197 216 Q 196 238 190 248 L 183 248 Q 177 234 174 210 Q 172 188 178 178 Z"
                  fill={isWorked('forearms') ? (selectedMuscle === 'forearms' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('forearms') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.4"
                />
                <ellipse cx="82" cy="258" rx="5" ry="8" fill="#242430" stroke="#333342" strokeWidth="1" />
                <ellipse cx="188" cy="258" rx="5" ry="8" fill="#242430" stroke="#333342" strokeWidth="1" />
              </g>

              {/* ABDOMINALES & CORE (6-PACK) */}
              <g id="front-abs" onClick={() => handleSelect('abs')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <rect x="121" y="132" width="12" height="15" rx="3" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <rect x="137" y="132" width="12" height="15" rx="3" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <rect x="121" y="150" width="12" height="16" rx="3" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <rect x="137" y="150" width="12" height="16" rx="3" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <path d="M 121 169 L 133 169 L 133 194 Q 124 188 121 169 Z" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <path d="M 149 169 L 137 169 L 137 194 Q 146 188 149 169 Z" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <path d="M 116 132 Q 106 142 108 165 Q 110 186 118 195 Q 120 180 119 160 Q 118 140 116 132 Z" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
                <path d="M 154 132 Q 164 142 162 165 Q 160 186 152 195 Q 150 180 151 160 Q 152 140 154 132 Z" fill={isWorked('abs') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'} stroke={isWorked('abs') ? '#60A5FA' : '#3A3A4A'} strokeWidth="1.2" />
              </g>

              {/* Pelvis */}
              <path d="M 119 196 Q 135 208 151 196 L 146 220 Q 135 224 124 220 Z" fill="#1C1C24" stroke="#333342" strokeWidth="1" />

              {/* CUÁDRICEPS */}
              <g id="front-quads" onClick={() => handleSelect('quads')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 121 218 Q 102 232 103 268 Q 104 305 117 334 Q 128 335 132 318 Q 134 290 133 260 Q 132 235 125 218 Z"
                  fill={isWorked('quads') ? (selectedMuscle === 'quads' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('quads') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
                <path d="M 124 298 Q 131 306 130 326 Q 124 328 122 315 Z" fill={isWorked('quads') ? '#93C5FD' : '#3A3A4A'} opacity="0.8" />
                <path
                  d="M 149 218 Q 168 232 167 268 Q 166 305 153 334 Q 142 335 138 318 Q 136 290 137 260 Q 138 235 145 218 Z"
                  fill={isWorked('quads') ? (selectedMuscle === 'quads' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('quads') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
                <path d="M 146 298 Q 139 306 140 326 Q 146 328 148 315 Z" fill={isWorked('quads') ? '#93C5FD' : '#3A3A4A'} opacity="0.8" />
              </g>

              {/* Rodillas */}
              <ellipse cx="122" cy="342" rx="6" ry="6" fill="#1C1C24" stroke="#333342" strokeWidth="1.2" />
              <ellipse cx="148" cy="342" rx="6" ry="6" fill="#1C1C24" stroke="#333342" strokeWidth="1.2" />

              {/* PANTORRILLAS (FRONTAL) */}
              <g id="front-calves" onClick={() => handleSelect('calves')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 117 350 Q 106 366 109 398 Q 112 432 119 452 L 126 452 Q 130 430 128 395 Q 126 366 125 350 Z"
                  fill={isWorked('calves') ? (selectedMuscle === 'calves' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('calves') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 153 350 Q 164 366 161 398 Q 158 432 151 452 L 144 452 Q 140 430 142 395 Q 144 366 145 350 Z"
                  fill={isWorked('calves') ? (selectedMuscle === 'calves' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('calves') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <path d="M 116 453 L 110 472 L 128 472 L 126 453 Z" fill="#1C1C24" stroke="#333342" strokeWidth="1" />
                <path d="M 154 453 L 160 472 L 142 472 L 144 453 Z" fill="#1C1C24" stroke="#333342" strokeWidth="1" />
              </g>
            </g>

            {/* ============================================================== */}
            {/* FIGURA POSTERIOR (Back View, Centro X = 365)                 */}
            {/* ============================================================== */}
            <g id="figure-back" transform="translate(10, 10)">
              <text x="365" y="24" fill="#64748B" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace" letterSpacing="1.5">
                VISTA POSTERIOR (ESPALDA)
              </text>

              {/* Nuca */}
              <ellipse cx="365" cy="52" rx="14" ry="18" fill="#1C1C24" stroke="#333342" strokeWidth="1.2" />

              {/* TRAPECIOS */}
              <g id="back-traps" onClick={() => handleSelect('traps')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 365 68 L 348 84 L 334 88 Q 346 100 365 132 Q 384 100 396 88 L 382 84 Z"
                  fill={isWorked('traps') ? (selectedMuscle === 'traps' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('traps') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <line x1="365" y1="68" x2="365" y2="132" stroke={isWorked('traps') ? '#93C5FD' : '#444455'} strokeWidth="1" />
              </g>

              {/* DELTOIDES POSTERIORES */}
              <g id="back-rear-delts" onClick={() => handleSelect('deltoids_rear')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 334 88 Q 322 88 312 98 Q 304 110 307 127 Q 314 136 321 132 Q 325 120 326 110 Q 328 98 334 88 Z"
                  fill={isWorked('deltoids_rear') ? (selectedMuscle === 'deltoids_rear' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('deltoids_rear') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 396 88 Q 408 88 418 98 Q 426 110 423 127 Q 416 136 409 132 Q 405 120 404 110 Q 402 98 396 88 Z"
                  fill={isWorked('deltoids_rear') ? (selectedMuscle === 'deltoids_rear' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('deltoids_rear') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* TRÍCEPS */}
              <g id="back-triceps" onClick={() => handleSelect('triceps')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 319 132 Q 307 140 308 160 Q 310 176 321 178 Q 328 176 329 160 Q 327 142 321 132 Z"
                  fill={isWorked('triceps') ? (selectedMuscle === 'triceps' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('triceps') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
                <path
                  d="M 411 132 Q 423 140 422 160 Q 420 176 409 178 Q 402 176 401 160 Q 403 142 409 132 Z"
                  fill={isWorked('triceps') ? (selectedMuscle === 'triceps' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('triceps') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.5"
                />
              </g>

              {/* ANTEBRAZOS (POSTERIOR) */}
              <g id="back-forearms" onClick={() => handleSelect('forearms')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 317 180 Q 302 192 303 218 Q 304 240 310 250 L 317 250 Q 323 236 326 212 Q 328 190 322 180 Z"
                  fill={isWorked('forearms') ? (selectedMuscle === 'forearms' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('forearms') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.4"
                />
                <path
                  d="M 413 180 Q 428 192 427 218 Q 426 240 420 250 L 413 250 Q 407 236 404 212 Q 402 190 408 180 Z"
                  fill={isWorked('forearms') ? (selectedMuscle === 'forearms' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('forearms') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.4"
                />
                <ellipse cx="312" cy="260" rx="5" ry="8" fill="#242430" stroke="#333342" strokeWidth="1" />
                <ellipse cx="418" cy="260" rx="5" ry="8" fill="#242430" stroke="#333342" strokeWidth="1" />
              </g>

              {/* DORSALES (LATS - ALAS EN V) */}
              <g id="back-lats" onClick={() => handleSelect('lats')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 334 116 Q 325 132 328 160 Q 330 180 348 194 L 358 194 Q 355 160 355 132 Z"
                  fill={isWorked('lats') ? (selectedMuscle === 'lats' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('lats') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                  filter={isWorked('lats') ? 'url(#hevyGlow)' : undefined}
                />
                <path
                  d="M 396 116 Q 405 132 402 160 Q 400 180 382 194 L 372 194 Q 375 160 375 132 Z"
                  fill={isWorked('lats') ? (selectedMuscle === 'lats' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('lats') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                  filter={isWorked('lats') ? 'url(#hevyGlow)' : undefined}
                />
                <path d="M 332 142 Q 344 154 356 160" stroke={isWorked('lats') ? '#93C5FD' : '#444455'} strokeWidth="0.8" fill="none" opacity="0.6" />
                <path d="M 398 142 Q 386 154 374 160" stroke={isWorked('lats') ? '#93C5FD' : '#444455'} strokeWidth="0.8" fill="none" opacity="0.6" />
              </g>

              {/* LUMBAR */}
              <g id="back-lower-back" onClick={() => handleSelect('lower_back')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 358 178 L 372 178 L 370 206 L 360 206 Z"
                  fill={isWorked('lower_back') ? 'url(#hevyBlueGrad)' : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('lower_back') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.2"
                />
              </g>

              {/* GLÚTEOS */}
              <g id="back-glutes" onClick={() => handleSelect('glutes')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 348 206 Q 334 218 335 240 Q 336 262 360 262 L 364 262 L 364 206 Z"
                  fill={isWorked('glutes') ? (selectedMuscle === 'glutes' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('glutes') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
                <path
                  d="M 382 206 Q 396 218 395 240 Q 394 262 370 262 L 366 262 L 366 206 Z"
                  fill={isWorked('glutes') ? (selectedMuscle === 'glutes' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('glutes') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
              </g>

              {/* ISQUIOTIBIALES (FEMORALES) */}
              <g id="back-hamstrings" onClick={() => handleSelect('hamstrings')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 338 266 Q 328 285 330 310 Q 333 334 346 338 Q 358 336 361 316 Q 363 290 361 266 Z"
                  fill={isWorked('hamstrings') ? (selectedMuscle === 'hamstrings' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('hamstrings') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
                <path
                  d="M 392 266 Q 402 285 400 310 Q 397 334 384 338 Q 372 336 369 316 Q 367 290 369 266 Z"
                  fill={isWorked('hamstrings') ? (selectedMuscle === 'hamstrings' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('hamstrings') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
              </g>

              {/* Hueco Poplíteo */}
              <ellipse cx="351" cy="342" rx="5" ry="3" fill="#1C1C24" stroke="#333342" strokeWidth="1" />
              <ellipse cx="379" cy="342" rx="5" ry="3" fill="#1C1C24" stroke="#333342" strokeWidth="1" />

              {/* PANTORRILLAS POSTERIORES (GEMELOS) */}
              <g id="back-calves" onClick={() => handleSelect('calves')} className="cursor-pointer transition-all duration-300 hover:opacity-90">
                <path
                  d="M 346 348 Q 332 360 334 388 Q 336 414 344 452 L 354 452 Q 358 418 358 388 Q 356 362 354 348 Z"
                  fill={isWorked('calves') ? (selectedMuscle === 'calves' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('calves') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
                <path
                  d="M 384 348 Q 398 360 396 388 Q 394 414 386 452 L 376 452 Q 372 418 372 388 Q 374 362 376 348 Z"
                  fill={isWorked('calves') ? (selectedMuscle === 'calves' ? 'url(#hevyBlueSelected)' : 'url(#hevyBlueGrad)') : 'url(#muscleIdleGrad)'}
                  stroke={isWorked('calves') ? '#60A5FA' : '#3A3A4A'}
                  strokeWidth="1.6"
                />
                <path d="M 344 453 L 340 472 L 356 472 L 354 453 Z" fill="#1C1C24" stroke="#333342" strokeWidth="1" />
                <path d="M 386 453 L 390 472 L 374 472 L 376 453 Z" fill="#1C1C24" stroke="#333342" strokeWidth="1" />
              </g>
            </g>
          </svg>
        </div>

        {/* PANEL LATERAL DERECHO: INSPECTOR DEL MÚSCULO SELECCIONADO */}
        <div
          style={{ flex: '1 1 320px', minWidth: '280px', maxWidth: '420px', width: '100%' }}
          className="flex flex-col gap-4"
        >
          {currentMuscleInfo ? (
            <div className="p-5 rounded-2xl bg-[#16161D] border border-[#262630] space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0084FF]/20 text-[#38BDF8] border border-[#0084FF]/30">
                  {currentMuscleInfo.category}
                </span>
                <span className={`w-3 h-3 rounded-full ${currentMuscleInfo.sets > 0 ? 'bg-[#0084FF] shadow-sm shadow-[#0084FF]' : 'bg-slate-600'}`} />
              </div>

              <div>
                <h4 className="text-xl font-black text-white tracking-tight">
                  {currentMuscleInfo.name}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentMuscleInfo.sets > 0
                    ? 'Grupo muscular estimulado en esta sesión / semana.'
                    : 'Sin volumen registrado en este periodo (recuperación activa).'}
                </p>
              </div>

              {/* KPIs de hipertrofia */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#0B0B0E] border border-[#262630]">
                  <span className="text-[10px] text-slate-400 font-mono block">Series Efectivas</span>
                  <span className="text-lg font-black text-white font-mono">
                    {currentMuscleInfo.sets} <span className="text-xs text-[#38BDF8]">sets</span>
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0B0B0E] border border-[#262630]">
                  <span className="text-[10px] text-slate-400 font-mono block">Tonelaje Movido</span>
                  <span className="text-lg font-black text-white font-mono">
                    {currentMuscleInfo.volumeKg.toLocaleString()} <span className="text-xs text-[#38BDF8]">kg</span>
                  </span>
                </div>
              </div>

              {currentMuscleInfo.lastExercise && (
                <div className="p-3 rounded-xl bg-[#0B0B0E] border border-[#262630] text-xs">
                  <span className="text-[10px] text-slate-400 font-mono block mb-1">Último Ejercicio Real</span>
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Dumbbell className="w-3.5 h-3.5 text-[#0084FF] shrink-0" />
                    <span className="truncate">{currentMuscleInfo.lastExercise}</span>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-slate-400 font-mono pt-1">
                Tip: Haz clic en cualquier músculo de la figura para auditar sus series y ejercicios.
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#16161D] border border-[#262630] text-center text-slate-400 text-xs">
              Toca o pasa el cursor sobre cualquier músculo de la figura para auditar su volumen.
            </div>
          )}

          {/* Selector rápido de músculos trabajados */}
          <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630] space-y-2">
            <span className="text-xs font-bold text-white block mb-2">
              Músculos Estimulados en esta Sesión:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(muscleData)
                .filter((m) => m.sets > 0)
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelect(m.id)}
                    className={`cursor-pointer px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                      selectedMuscle === m.id
                        ? 'bg-[#0084FF] text-white border-[#38BDF8]'
                        : 'bg-[#0B0B0E] text-slate-300 border-[#262630] hover:border-[#0084FF]'
                    }`}
                  >
                    {m.name.split(' ')[0]} ({m.sets}s)
                  </button>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. BARRA DE CALENDARIO SEMANAL ESTILO HEVY (S M T W T F S) */}
      <div className="pt-4 border-t border-[#262630]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0084FF]" />
            <span>Registro Semanal de Entrenamientos Hevy</span>
          </span>
          <span className="text-[11px] font-mono text-[#38BDF8]">
            3 sesiones registradas • 100% consistencia
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {weekDays.map((w, idx) => {
            const isSelected = activeDayIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveDayIndex(idx);
                  if (w.hasWorkout) {
                    if (idx === 1) setActivePreset('legs');
                    else if (idx === 3) setActivePreset('shoulders_arms');
                    else if (idx === 5) setActivePreset('chest_back');
                  }
                }}
                className={`cursor-pointer flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-[#16161D] border-[#0084FF] shadow-lg shadow-[#0084FF]/20'
                    : 'bg-[#111116] border-[#262630] hover:border-slate-700'
                }`}
              >
                <span className="text-[11px] font-bold text-slate-400 mb-1">{w.label}</span>
                {w.hasWorkout ? (
                  <div className="w-8 h-8 rounded-full bg-[#0084FF] text-white font-black text-xs flex items-center justify-center shadow-md shadow-[#0084FF]/40">
                    {w.day}
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-transparent text-slate-400 font-mono text-xs flex items-center justify-center">
                    {w.day}
                  </div>
                )}
                <span className="w-1.5 h-1.5 rounded-full mt-1.5" style={{ backgroundColor: w.hasWorkout ? '#0084FF' : 'transparent' }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
