'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Compass,
  MapPin,
  Sun,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  GraduationCap,
  Footprints,
  Coins,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  initialDogs,
  calculateWalkSchedule,
  DogProfile,
} from '@/lib/walkSimulatorStore';

export default function UpbWalkSimulatorSection() {
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(['dog-frida', 'dog-sienna']);
  const [classTime, setClassTime] = useState<string>('07:00');
  const [commuteTime, setCommuteTime] = useState<number>(25); // 25 min to UPB Km 8
  const [prepTime, setPrepTime] = useState<number>(20); // Ducha y mochila

  const schedule = useMemo(() => {
    return calculateWalkSchedule(selectedDogIds, classTime, commuteTime, prepTime, 10);
  }, [selectedDogIds, classTime, commuteTime, prepTime]);

  const toggleDog = (id: string) => {
    setSelectedDogIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  return (
    <section id="upb-walk-simulator-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Footprints className="w-3.5 h-3.5 text-amber-600" />
              Simulador de Paseos y Rutinas UPB
            </span>
            <span className="text-xs font-mono text-slate-400">Montería • Campus Km 8 Vía Cereté</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Optimizador de Paseos Caninos & Puntualidad UPB
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Calcula la hora exacta de salida matutina según los perros que pasees hoy (Frida, Sienna), cuidando sus patas del calor de Montería y garantizando tu llegada puntual a clases.
          </p>
        </div>

        {/* Badge de Confort Térmico */}
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
            schedule.thermalRisk.includes('Alerta')
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : schedule.thermalRisk.includes('Aceptable')
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl text-white shadow-xs ${
              schedule.thermalRisk.includes('Alerta')
                ? 'bg-rose-600'
                : schedule.thermalRisk.includes('Aceptable')
                ? 'bg-amber-600'
                : 'bg-emerald-600'
            }`}
          >
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider block opacity-80">
              Clima Montería (Pavimento)
            </span>
            <span className="text-sm font-extrabold block">{schedule.thermalRisk}</span>
          </div>
        </div>
      </div>

      {/* Controles de Simulación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Selector de Perros */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-amber-600" />
              ¿Qué perros paseas hoy?
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Duración total: <strong>{schedule.totalWalkDurationMin} min</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {initialDogs.map((dog) => {
              const isSelected = selectedDogIds.includes(dog.id);
              return (
                <button
                  key={dog.id}
                  onClick={() => toggleDog(dog.id)}
                  className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-white border-amber-400 ring-2 ring-amber-300/40 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">{dog.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {dog.defaultDurationMin} min
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{dog.breed}</div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">Cliente: {dog.owner}</span>
                    <span className="text-xs font-bold text-emerald-700">
                      +${dog.ratePerWalk.toLocaleString('es-CO')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ingreso proyectado */}
          {schedule.totalProjectedIncome > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-medium flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                Ingreso diario sumado a tus finanzas por estos paseos:
              </span>
              <span className="text-sm font-extrabold text-emerald-950">
                +${schedule.totalProjectedIncome.toLocaleString('es-CO')} COP
              </span>
            </div>
          )}
        </div>

        {/* Selector de Horario UPB */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-3">
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              Horario en la UPB Montería
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Hora de inicio de clase:
                </label>
                <select
                  value={classTime}
                  onChange={(e) => setClassTime(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="06:00">06:00 AM (Primera hora)</option>
                  <option value="07:00">07:00 AM (Horario habitual)</option>
                  <option value="08:00">08:00 AM</option>
                  <option value="09:00">09:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="14:00">02:00 PM (Tarde)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Traslado a UPB (Km 8 Vía Cereté):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="15"
                    max="45"
                    step="5"
                    value={commuteTime}
                    onChange={(e) => setCommuteTime(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800 w-12 text-right">{commuteTime} min</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  Alistamiento en casa (Ducha y maleta):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="35"
                    step="5"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="flex-1 accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-800 w-12 text-right">{prepTime} min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Probabilidad de puntualidad:</span>
            <span className="font-extrabold text-emerald-600 text-sm">{schedule.punctualityScore}%</span>
          </div>
        </div>
      </div>

      {/* Cronograma Calculado (Timeline) */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          Cronograma Matutino Optimizado
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* Paso 1: Alarma */}
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-[10px] font-bold uppercase text-indigo-700 block">1. Alarma / Despertar</span>
            <span className="text-2xl font-black text-indigo-950 mt-1 block">
              {schedule.recommendedWakeUpTime}
            </span>
            <span className="text-[11px] text-indigo-800/80 mt-1 block">Alístate con ropa cómoda</span>
          </div>

          {/* Paso 2: Salida Paseo */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">2. Salida Paseo</span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {schedule.recommendedWalkDepartureTime}
            </span>
            <span className="text-[11px] text-amber-800/80 mt-1 block">
              {schedule.totalWalkDurationMin} min con correa
            </span>
          </div>

          {/* Paso 3: Regreso a Casa */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
            <span className="text-[10px] font-bold uppercase text-teal-700 block">3. Regreso a Casa</span>
            <span className="text-2xl font-black text-teal-950 mt-1 block">
              {schedule.walkReturnTime}
            </span>
            <span className="text-[11px] text-teal-800/80 mt-1 block">Hidratación + Ducha rápida</span>
          </div>

          {/* Paso 4: Salida a UPB */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-[10px] font-bold uppercase text-blue-700 block">4. Salida a UPB</span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {schedule.homeDepartureTime}
            </span>
            <span className="text-[11px] text-blue-800/80 mt-1 block">Ruta Cereté ({commuteTime} min)</span>
          </div>

          {/* Paso 5: Llegada al Aula */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-emerald-800 block">5. Llegada al Aula</span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {schedule.upbArrivalTime}
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
              +{schedule.bufferMarginMin} min antes de clase
            </span>
          </div>
        </div>

        {/* Notas del Asistente */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="space-y-1.5">
            {schedule.notes.map((note, idx) => (
              <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
