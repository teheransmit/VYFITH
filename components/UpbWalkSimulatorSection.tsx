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
  Settings2,
  History,
  Shuffle,
  Route,
} from 'lucide-react';
import {
  initialDogs,
  calculateWalkSchedule,
  DogProfile,
} from '@/lib/walkSimulatorStore';
import WalkRouteMap from '@/components/WalkRouteMap';

export default function UpbWalkSimulatorSection() {
  const [selectedDogIds, setSelectedDogIds] = useState<string[]>(['dog-frida', 'dog-sienna']);
  const [classTime, setClassTime] = useState<string>('07:00');
  const [commuteTime, setCommuteTime] = useState<number>(25); // 25 min to UPB Km 8
  const [prepTime, setPrepTime] = useState<number>(20); // Ducha y mochila
  const [activeView, setActiveView] = useState<'plan' | 'config' | 'history'>('plan');
  const [day, setDay] = useState<'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes'>('lunes');
  const [startLocation, setStartLocation] = useState<'centro' | 'abuela'>('centro');
  const [transport, setTransport] = useState<'pie' | 'moto'>('pie');
  const [strategy, setStrategy] = useState<'zigzag' | 'lineal' | 'terminar'>('zigzag');
  const [scenario, setScenario] = useState<'normal' | 'lluvia' | 'trafico'>('normal');
  const [dogOrder, setDogOrder] = useState<string[]>(['dog-sienna', 'dog-frida']);
  const [walkGoals, setWalkGoals] = useState<Record<string, number>>({ 'dog-sienna': 40, 'dog-frida': 30 });
  const [history, setHistory] = useState<Array<{ date: string; day: string; arrival: string; classTime: string; dogs: string[]; strategy: string; scenario: string }>>(() => {
    if (typeof window === 'undefined') return [];
    const saved = window.localStorage.getItem('vyfith_walk_beta_history');
    return saved ? JSON.parse(saved) : [];
  });

  const dayClasses = {
    lunes: '10:00',
    martes: '08:00',
    miercoles: '10:00',
    jueves: '08:00',
    viernes: '10:00',
  } as const;

  const locationAdjustment = startLocation === 'abuela' ? 5 : 0;
  const trafficAdjustment = scenario === 'trafico' ? 10 : 0;
  const effectiveCommuteTime = transport === 'moto'
    ? Math.max(10, commuteTime + locationAdjustment + trafficAdjustment - 10)
    : commuteTime + locationAdjustment + trafficAdjustment;
  const adjustedGoals = scenario === 'lluvia'
    ? Object.fromEntries(Object.entries(walkGoals).map(([id, minutes]) => [id, Math.ceil(minutes * 0.85)]))
    : walkGoals;

  const betaSchedule = useMemo(() => calculateWalkSchedule(
    selectedDogIds,
    classTime,
    effectiveCommuteTime,
    prepTime,
    10,
    adjustedGoals
  ), [selectedDogIds, classTime, effectiveCommuteTime, prepTime, adjustedGoals]);

  const toggleDog = (id: string) => {
    setSelectedDogIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const shuffleOrder = () => {
    const next = [...dogOrder].sort(() => Math.random() - 0.5);
    setDogOrder(next);
  };

  const registerToday = () => {
    setHistory((current) => [
      {
        date: new Date().toLocaleDateString('es-CO'),
        day,
        arrival: betaSchedule.upbArrivalTime,
        classTime,
        dogs: selectedDogIds,
        strategy,
        scenario,
      },
      ...current,
    ].slice(0, 12));
    setActiveView('history');
  };

  React.useEffect(() => {
    window.localStorage.setItem('vyfith_walk_beta_history', JSON.stringify(history));
  }, [history]);

  return (
    <section id="upb-walk-simulator-section" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-10 transition-colors">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <Footprints className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Simulador de Paseos y Rutinas UPB
            </span>
            <span className="text-xs font-mono text-slate-400">Beta unificada • Montería • Campus Km 8</span>
          </div>

          <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            {[
              ['plan', 'Plan de hoy', Route],
              ['config', 'Configuración beta', Settings2],
              ['history', 'Historial', History],
            ].map(([id, label, Icon]) => (
              <button
                key={id as string}
                type="button"
                onClick={() => setActiveView(id as 'plan' | 'config' | 'history')}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${
                  activeView === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label as string}
              </button>
            ))}
          </div>

          {activeView === 'config' && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-5 border border-slate-200 dark:border-slate-700">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Día de rutina
                <select value={day} onChange={(e) => { const next = e.target.value as typeof day; setDay(next); setClassTime(dayClasses[next]); }} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="lunes">Lunes</option><option value="martes">Martes</option><option value="miercoles">Miércoles</option><option value="jueves">Jueves</option><option value="viernes">Viernes</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Origen
                <select value={startLocation} onChange={(e) => setStartLocation(e.target.value as typeof startLocation)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="centro">Casa Centro</option><option value="abuela">Casa Abuela</option>
                </select>
              </label>
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Primer traslado</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(['pie', 'moto'] as const).map((value) => <button key={value} type="button" onClick={() => setTransport(value)} className={`rounded-xl px-3 py-2 text-xs font-bold ${transport === value ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'}`}>{value === 'pie' ? 'Caminando' : 'En moto'}</button>)}
                </div>
              </div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Estrategia de ruta
                <select value={strategy} onChange={(e) => setStrategy(e.target.value as typeof strategy)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="zigzag">Zigzag activo</option><option value="lineal">Ida y vuelta lineal</option><option value="terminar">Terminar en el último</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Escenario
                <select value={scenario} onChange={(e) => setScenario(e.target.value as typeof scenario)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <option value="normal">Despejado</option><option value="lluvia">Lluvia</option><option value="trafico">Tráfico pesado</option>
                </select>
              </label>
              <div className="flex items-end">
                <button type="button" onClick={shuffleOrder} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white"><Shuffle className="h-3.5 w-3.5" /> Orden aleatorio</button>
              </div>
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {dogOrder.map((id) => {
                  const dog = initialDogs.find((item) => item.id === id);
                  if (!dog) return null;
                  return <label key={id} className="rounded-xl bg-white dark:bg-slate-900 p-3 text-xs font-bold text-slate-700 dark:text-slate-200">{dog.name} · minutos objetivo<input type="number" min="5" max="120" value={walkGoals[id] ?? dog.defaultDurationMin} onChange={(e) => setWalkGoals((current) => ({ ...current, [id]: Number(e.target.value) || dog.defaultDurationMin }))} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-800" /></label>;
                })}
              </div>
            </div>
          )}

          {activeView === 'history' && (
            <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900 dark:text-white">Historial beta de puntualidad</h3><button type="button" onClick={() => setHistory([])} className="text-xs text-rose-600">Limpiar</button></div>
              {history.length === 0 ? <p className="mt-4 text-sm text-slate-500">Aún no has registrado una rutina.</p> : <div className="mt-4 space-y-2">{history.map((item, index) => <div key={`${item.date}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs"><span className="font-bold text-slate-800 dark:text-slate-200">{item.date} · {item.day}</span><span className="text-slate-500">Llegada {item.arrival} / clase {item.classTime}</span><span className="font-bold text-indigo-600">{item.strategy} · {item.scenario}</span></div>)}</div>}
            </div>
          )}
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Optimizador de Paseos Caninos & Puntualidad UPB
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-2xl mt-1">
            Calcula la hora exacta de salida matutina según los perros que pasees hoy (Frida, Sienna), cuidando sus patas del calor de Montería y garantizando tu llegada puntual a clases.
          </p>
        </div>

        {/* Badge de Confort Térmico */}
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${
            betaSchedule.thermalRisk.includes('Alerta')
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : betaSchedule.thermalRisk.includes('Aceptable')
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div
            className={`p-2.5 rounded-xl text-white shadow-xs ${
              betaSchedule.thermalRisk.includes('Alerta')
                ? 'bg-rose-600'
                : betaSchedule.thermalRisk.includes('Aceptable')
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
            <span className="text-sm font-extrabold block">{betaSchedule.thermalRisk}</span>
          </div>
        </div>
      </div>

      {activeView === 'plan' && <>{/* Controles de Simulación */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-6">
        {/* Selector de Perros */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-amber-600" />
              ¿Qué perros paseas hoy?
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Duración total: <strong>{betaSchedule.totalWalkDurationMin} min</strong>
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
          {betaSchedule.totalProjectedIncome > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="text-emerald-900 font-medium flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                Ingreso diario sumado a tus finanzas por estos paseos:
              </span>
              <span className="text-sm font-extrabold text-emerald-950">
                +${betaSchedule.totalProjectedIncome.toLocaleString('es-CO')} COP
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
            <span className="font-extrabold text-emerald-600 text-sm">{betaSchedule.punctualityScore}%</span>
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
              {betaSchedule.recommendedWakeUpTime}
            </span>
            <span className="text-[11px] text-indigo-800/80 mt-1 block">Alístate con ropa cómoda</span>
          </div>

          {/* Paso 2: Salida Paseo */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-[10px] font-bold uppercase text-amber-700 block">2. Salida Paseo</span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {betaSchedule.recommendedWalkDepartureTime}
            </span>
            <span className="text-[11px] text-amber-800/80 mt-1 block">
              {betaSchedule.totalWalkDurationMin} min con correa
            </span>
          </div>

          {/* Paso 3: Regreso a Casa */}
          <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100">
            <span className="text-[10px] font-bold uppercase text-teal-700 block">3. Regreso a Casa</span>
            <span className="text-2xl font-black text-teal-950 mt-1 block">
              {betaSchedule.walkReturnTime}
            </span>
            <span className="text-[11px] text-teal-800/80 mt-1 block">Hidratación + Ducha rápida</span>
          </div>

          {/* Paso 4: Salida a UPB */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-[10px] font-bold uppercase text-blue-700 block">4. Salida a UPB</span>
            <span className="text-2xl font-black text-blue-950 mt-1 block">
              {betaSchedule.homeDepartureTime}
            </span>
            <span className="text-[11px] text-blue-800/80 mt-1 block">Ruta Cereté ({commuteTime} min)</span>
          </div>

          {/* Paso 5: Llegada al Aula */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-bold uppercase text-emerald-800 block">5. Llegada al Aula</span>
            <span className="text-2xl font-black text-emerald-950 mt-1 block">
              {betaSchedule.upbArrivalTime}
            </span>
            <span className="text-[11px] text-emerald-800 font-semibold mt-1 block">
              +{betaSchedule.bufferMarginMin} min antes de clase
            </span>
          </div>
        </div>

        {/* Notas del Asistente */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="space-y-1.5">
            {betaSchedule.notes.map((note, idx) => (
              <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <WalkRouteMap selectedDogIds={selectedDogIds} startLocation={startLocation} />
      <button type="button" onClick={registerToday} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-4 w-4" /> Registrar este plan</button>
      </>}
    </section>
  );
}
