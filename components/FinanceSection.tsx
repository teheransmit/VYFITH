'use client';

import React, { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  Plane,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,
  PlusCircle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Luggage,
  AlertCircle,
  Bus,
  MapPin,
  QrCode,
  CheckSquare,
  Square,
  Calendar,
  Navigation,
  Car,
  Train,
  ArrowRight,
  Footprints,
  Scissors,
  Banknote,
} from 'lucide-react';
import { initialFinanceData, FinanceSummary, ExpenseItem, ReceivableItem } from '@/lib/financeStore';
import Rome2RioRouteMap from '@/components/Rome2RioRouteMap';

export default function FinanceSection() {
  const [finance, setFinance] = useState<FinanceSummary>(initialFinanceData);
  const [activeTab, setActiveTab] = useState<'general' | 'medellin' | 'cobros'>('medellin');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  // Checklist interactivo pre-vuelo para no tener ningún imprevisto
  const [checklist, setChecklist] = useState([
    { id: 'c1', label: 'Cédula de ciudadanía física original (indispensable para abordar y sacar la Cívica)', done: true },
    { id: 'c2', label: 'Pasabordo JetSMART con código QR guardado en fotos del celular (JA5483)', done: true },
    { id: 'c3', label: 'Mochila Temu con correas de compresión tensadas (dimensiones ≤ 45x35x25 cm, peso ≤ 10 kg)', done: true },
    { id: 'c4', label: 'Líquidos y geles en envases individuales ≤ 100 ml en bolsa Ziploc transparente (desodorante de 260 ml descartado)', done: false },
    { id: 'c5', label: 'Computador portátil, cargador y Powerbank en la mochila contigo (prohibido litio en bodega)', done: false },
    { id: 'c6', label: 'Llegada al Aeropuerto Los Garzones a las 10:48 AM (subir directo al 2.° piso a rayos X)', done: false },
    { id: 'c7', label: 'Tomar bus blanco en Rionegro hacia San Diego ($15.000 COP) y tramitar Cívica en PAC Estación San Antonio', done: false },
  ]);

  const toggleChecklist = (id: string) => {
    setChecklist((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const remainingBudget = finance.monthlyBudget - finance.totalExpenses;
  const budgetPercentUsed = Math.min(100, Math.round((finance.totalExpenses / finance.monthlyBudget) * 100));

  // Cálculo del Viaje Medellín en tiempo real (Miércoles 7 de Octubre de 2026)
  const med = finance.medellinTrip;
  const totalLiquidAvailable = med.cashInHand + med.nuBoxSavings + med.nequiSavings; // $350.579 COP
  const realFreeSurplus = totalLiquidAvailable + med.receivablesTotal - med.pendingFixedExpenses; // $338.579 COP
  const totalTripSecuredCapital = realFreeSurplus + med.pendingFamilyContributions; // $488.579 COP
  const netTripSurplus = totalTripSecuredCapital - med.targetBudget; // +$113.579 COP de excedente
  const tripCoveragePercent = Math.min(100, Math.round((totalTripSecuredCapital / med.targetBudget) * 100)); // 100% Cobertura asegurada

  // Registrar un cobro, gasto o ingreso rápido
  const handleQuickAdd = (type: 'barber' | 'familySync' | 'frida' | 'molly' | 'sienna' | 'papa') => {
    if (type === 'barber') {
      const cost = 12000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          cashInHand: Math.max(0, prev.medellinTrip.cashInHand - cost),
          pendingFixedExpenses: 0,
        },
      }));
      showNotice(`💈 -$12.000 COP descontados en efectivo para la motilada de hoy. Gastos fijos liquidados.`);
    } else if (type === 'familySync') {
      const added = 150000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          nuBoxSavings: prev.medellinTrip.nuBoxSavings + added,
          pendingFamilyContributions: 0,
        },
      }));
      showNotice(`👨‍👩‍👦 +$150.000 COP recibidos de padres e ingresados a Cajita Medayork de Nu (9.35% E.A.).`);
    } else if (type === 'frida') {
      showNotice(`✅ Cartera de Frida ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'molly') {
      showNotice(`✅ Cartera de Molly ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'sienna') {
      showNotice(`✅ Cartera de Sienna ya liquidada ($0.00 COP pendientes).`);
    } else if (type === 'papa') {
      showNotice(`✅ Pasajes ya liquidados en el modelo general.`);
    }
  };

  const showNotice = (msg: string) => {
    setQuickNotice(msg);
    setTimeout(() => setQuickNotice(null), 4000);
  };

  return (
    <section id="finance-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Finanzas Personales & Ecosistema de Ahorro
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 4: Economía & Metas</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Control Financiero & Plan Medellín 2026
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Supervisa tus presupuestos mensuales, rentabilidad en Cajita Nu (9.30% E.A.), cobros por paseos caninos y el colchón financiero proyectado para tu viaje.
          </p>
        </div>

        {/* Pestañas de Navegación Interna */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('medellin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'medellin'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-emerald-600" />
            Viaje Medellín 2026
          </button>
          <button
            onClick={() => setActiveTab('cobros')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'cobros'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-amber-600" />
            Cuentas por Cobrar
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-slate-600" />
            Presupuesto Mensual
          </button>
        </div>
      </div>

      {quickNotice && (
        <div className="my-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between animate-fade-in">
          <span>{quickNotice}</span>
          <button onClick={() => setQuickNotice(null)} className="text-emerald-700 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 1: VIAJE MEDELLÍN 2026 */}
      {/* ======================================================== */}
      {activeTab === 'medellin' && (
        <div className="mt-6 space-y-6">
          {/* Banner de Estado del Viaje */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 mb-2">
                  <Plane className="w-3.5 h-3.5" />
                  <span>Fechas: {med.tripDates} (5 Días)</span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight">Presupuesto del Viaje a Medellín</h3>
                <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
                  Alojamiento 100% cubierto. Fondos proyectados con ahorro de pasajes semanales ($35k con tarjeta hermano), cobros pendientes de paseos y Cajita Nu.
                </p>
              </div>

              <div className="text-right self-start md:self-center bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                <span className="text-[11px] text-emerald-200 uppercase tracking-wider block font-semibold">
                  Meta del Viaje
                </span>
                <span className="text-2xl font-black text-white">{formatCurrency(med.targetBudget)}</span>
                <span className="text-[11px] text-emerald-300 block font-medium">Costo total proyectado</span>
              </div>
            </div>

            {/* Barra de Cobertura */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex justify-between items-center text-xs font-bold mb-2">
                <span className="text-emerald-200">Capital Asegurado Proyectado: {formatCurrency(totalTripSecuredCapital)}</span>
                <span className="text-emerald-300">Cobertura: {tripCoveragePercent}%</span>
              </div>
              <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 to-teal-300 rounded-full transition-all"
                  style={{ width: `${tripCoveragePercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-100/70 mt-2">
                <span>Saldo a favor asegurado: <strong>+{formatCurrency(netTripSurplus)} COP</strong> de colchón</span>
                <span className="text-emerald-300 font-bold">Estado: {med.statusDiagnostic}</span>
              </div>
            </div>
          </div>

          {/* BALANCE EN TABLA (ESTADO DE CUENTAS) & RECOMENDACIONES TÁCTICAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Tabla de Balance Real */}
            <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Balance en Tiempo Real (Estado de Cuentas)
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Miércoles 7 de Octubre de 2026 • Menos de 24h pre-vuelo. Vuelos y Airbnb 100% liquidados en $0.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {med.statusDiagnostic}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="pb-2 font-bold">Concepto (Variable de Estado)</th>
                      <th className="pb-2 font-bold text-right">Saldo Actual (COP)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Efectivo en mano (Físico para aterrizar)
                      </td>
                      <td className="py-2 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(med.cashInHand)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 font-medium text-slate-700 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                        Cuenta Nu (Cajita Medayork al 9.35% E.A.)
                      </td>
                      <td className="py-2 text-right font-bold text-purple-900 font-mono">
                        {formatCurrency(med.nuBoxSavings)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 font-medium text-slate-500 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                        Cuenta Nequi
                      </td>
                      <td className="py-2 text-right font-medium text-slate-400 font-mono">
                        {formatCurrency(med.nequiSavings)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50 font-semibold">
                      <td className="py-2 text-emerald-950">Total Líquido Disponible</td>
                      <td className="py-2 text-right font-black text-emerald-800 font-mono">
                        {formatCurrency(totalLiquidAvailable)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 text-slate-600">
                        Cuentas por cobrar en calle (Rappi, Frida, Sienna, Andrés)
                      </td>
                      <td className="py-2 text-right font-bold text-emerald-600 font-mono">
                        $0.00 COP ✅
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 text-rose-700 font-medium">
                        Deuda de vuelos y Gastos fijos próximos (Motilada pendiente)
                      </td>
                      <td className="py-2 text-right font-bold text-rose-600 font-mono">
                        -{formatCurrency(med.pendingFixedExpenses)}
                      </td>
                    </tr>
                    <tr className="bg-teal-50/60 font-semibold">
                      <td className="py-2 text-teal-950">Excedente Líquido Libre real</td>
                      <td className="py-2 text-right font-black text-teal-800 font-mono">
                        {formatCurrency(realFreeSurplus)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50">
                      <td className="py-2 text-blue-700">
                        Fondo para Medellín (Papá $100k + Mamá $50k)
                      </td>
                      <td className="py-2 text-right font-bold text-blue-700 font-mono">
                        {formatCurrency(med.pendingFamilyContributions)}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold rounded-xl">
                      <td className="py-2.5 px-2 rounded-l-xl">Capital Total Asegurado</td>
                      <td className="py-2.5 px-2 rounded-r-xl text-right font-black text-emerald-300 font-mono">
                        {formatCurrency(totalTripSecuredCapital)}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-100/50 text-slate-500">
                      <td className="py-2">Costo Total Estimado RESTANTE</td>
                      <td className="py-2 text-right font-bold text-slate-700 font-mono">
                        -{formatCurrency(med.targetBudget)}
                      </td>
                    </tr>
                    <tr className="bg-emerald-100/70 text-emerald-950 font-bold">
                      <td className="py-2 px-2 rounded-l-xl">Excedente Neto Asegurado (Colchón Libre)</td>
                      <td className="py-2 px-2 rounded-r-xl text-right font-black text-emerald-700 font-mono">
                        +{formatCurrency(netTripSurplus)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recomendaciones Tácticas */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-3.5">
              <div className="p-5 rounded-3xl bg-linear-to-br from-amber-500/10 via-amber-50 to-orange-50 border border-amber-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                    Prioridad Alta
                  </span>
                  <Scissors className="w-4 h-4 text-amber-700" />
                </div>
                <h5 className="text-sm font-bold text-slate-900">1. Ejecutar gasto de motilada</h5>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  El embarque cierra mañana a las 11:58 a.m. Se debe descontar hoy mismo el bloque de <strong>-$12.000 COP</strong> del efectivo disponible para ir a la barbería y no generar cuellos de botella operativos en la mañana del viaje.
                </p>
                <button
                  onClick={() => handleQuickAdd('barber')}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  Ejecutar Gasto de Motilada (-$12.000 COP)
                </button>
              </div>

              <div className="p-5 rounded-3xl bg-linear-to-br from-blue-500/10 via-blue-50 to-indigo-50 border border-blue-200/90 shadow-2xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-300">
                    Prioridad Media
                  </span>
                  <PiggyBank className="w-4 h-4 text-blue-700" />
                </div>
                <h5 className="text-sm font-bold text-slate-900">2. Sincronización familiar</h5>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Solicitar esta misma noche el bloque de <strong>$150.000 COP</strong> restante a los padres (Papá $100k + Mamá $50k) para unificar el 100% del capital en la base de datos de Nu al 9.35% E.A. antes del despliegue al aeropuerto.
                </p>
                <button
                  onClick={() => handleQuickAdd('familySync')}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Sincronizar Aporte Familiar (+$150.000 COP)
                </button>
              </div>
            </div>
          </div>

          {/* VUELOS OFICIALES & TARJETA DE EMBARQUE JETSMART */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Vuelo de Ida */}
            <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-indigo-950 text-white border border-indigo-800/40 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-400 rotate-45" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Vuelo de Ida (Mañana)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Check-in Confirmado ✅
                </span>
              </div>

              <div className="flex items-center justify-between my-2">
                <div>
                  <span className="text-2xl font-black tracking-tight text-white">MTR</span>
                  <span className="text-xs text-slate-300 block">Montería (Los Garzones)</span>
                  <span className="text-sm font-bold text-emerald-300">12:48 PM</span>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] text-slate-400 font-mono">Vuelo JA 5483</span>
                  <div className="w-20 h-0.5 bg-linear-to-r from-emerald-400 to-indigo-400 my-1 relative">
                    <Plane className="w-3 h-3 text-white absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  </div>
                  <span className="text-[10px] text-slate-400">1 hora de trayecto</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black tracking-tight text-white">MDE</span>
                  <span className="text-xs text-slate-300 block">Medellín (Rionegro)</span>
                  <span className="text-sm font-bold text-emerald-300">01:49 PM</span>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-white/10 text-center">
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">PNR Reserva</span>
                  <span className="text-xs font-mono font-bold text-white">WCZUYT</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Asiento</span>
                  <span className="text-xs font-mono font-black text-emerald-300">20 B</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Zona Embarque</span>
                  <span className="text-xs font-mono font-bold text-white">Zona 3</span>
                </div>
                <div className="bg-white/5 rounded-xl p-2">
                  <span className="text-[10px] text-slate-400 block">Llegada Aerop.</span>
                  <span className="text-xs font-mono font-bold text-amber-300">10:48 AM</span>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                <span className="text-slate-300 flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-emerald-400" />
                  Equipaje: 1 Mochila Temu (35x25x45 cm, máx 10 kg)
                </span>
                <span className="text-emerald-300 font-bold">Bajo asiento</span>
              </div>
            </div>

            {/* Vuelo de Regreso & Traslado */}
            <div className="p-5 rounded-3xl bg-slate-900 text-white border border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-blue-400 -rotate-45" />
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Vuelo de Regreso</span>
                  </div>
                  <span className="text-xs text-slate-400">Lunes 12 OCT 2026</span>
                </div>

                <div className="flex items-center justify-between my-2">
                  <div>
                    <span className="text-2xl font-black text-white">MDE</span>
                    <span className="text-xs text-slate-400 block">Medellín (JMC)</span>
                    <span className="text-sm font-bold text-blue-300">07:17 AM</span>
                  </div>
                  <div className="flex flex-col items-center px-4">
                    <span className="text-[10px] text-slate-400 font-mono">Vuelo JA 5480</span>
                    <div className="w-16 h-0.5 bg-slate-700 my-1" />
                    <span className="text-[10px] text-slate-400">1h 01m</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">MTR</span>
                    <span className="text-xs text-slate-400 block">Montería</span>
                    <span className="text-sm font-bold text-blue-300">08:18 AM</span>
                  </div>
                </div>
              </div>

              {/* Conexión Aeropuerto a Medellín */}
              <div className="mt-4 p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/40">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5 mb-1">
                  <Bus className="w-3.5 h-3.5" />
                  Traslado Rionegro ➡️ Medellín Centro ($15.000 COP)
                </span>
                <p className="text-[11px] text-indigo-100/80 leading-relaxed">
                  Al salir de llegadas en MDE, toma el bus blanco directo a San Diego / Centro (45 min por el Túnel de Oriente). Desde allí camina o toma Metro hasta el PAC de <strong>Estación San Antonio</strong> para expedir tu tarjeta Cívica personalizada antes de las 6:45 PM.
                </p>
              </div>
            </div>
          </div>

          {/* CHECKLIST INTERACTIVO ANTI-IMPREVISTOS */}
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Checklist Digital Pre-Vuelo (Cero Imprevistos)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marca cada elemento conforme lo tengas listo en tu mochila para viajar con total tranquilidad.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                {checklist.filter((c) => c.done).length} de {checklist.length} listos
              </span>
            </div>

            <div className="space-y-2 mt-4">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklist(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 select-none ${
                    item.done
                      ? 'bg-white border-emerald-300 text-slate-800 shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${item.done ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium ${item.done ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ITINERARIO PUERTA A PUERTA (ESTILO ROME2RIO) */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-teal-950 text-white border border-teal-800/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/10 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-1.5 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    <Navigation className="w-4 h-4" />
                  </span>
                  <h4 className="text-base font-extrabold tracking-tight text-white">
                    Ruta Puerta a Puerta (Rome2Rio): De tu Casa a Medellín
                  </h4>
                </div>
                <p className="text-xs text-slate-300">
                  Itinerario multimodal detallado: Calle 35 ➔ Aeropuerto MTR ➔ Vuelo JA5483 ➔ Rionegro ➔ Medellín Centro ➔ PAC San Antonio.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 border border-teal-400/30">
                  ⏱️ Duración Total: ~4h 30m
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/10 text-slate-200 border border-white/10">
                  🛣️ 4 Tramos
                </span>
              </div>
            </div>

            {/* Mapa Interactivo OpenStreetMap (Leaflet) */}
            <div className="mb-6">
              <Rome2RioRouteMap />
            </div>

            {/* Stepper / Timeline de Tramos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Tramo 1 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Car className="w-3.5 h-3.5" /> Tramo 1: Urbano
                    </span>
                    <span className="text-[10px] text-slate-400">~12.5 km</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Casa ➔ Aeropuerto MTR</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Taxi / Urbano desde <strong>Cl 35 # 15B-18</strong> hacia Aeropuerto Los Garzones.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Salida: <strong>10:25 AM</strong> (25m)</span>
                  <span className="text-amber-300 font-bold">~$25k - $30k</span>
                </div>
              </div>

              {/* Tramo 2 */}
              <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 flex flex-col justify-between hover:bg-teal-900/30 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300 flex items-center gap-1">
                      <Plane className="w-3.5 h-3.5" /> Tramo 2: Vuelo
                    </span>
                    <span className="text-[10px] text-teal-300 font-mono">JA 5483</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">MTR ➔ MDE (Rionegro)</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    JetSMART directo. Embarque: <strong>11:58 AM</strong> | Despegue: <strong>12:48 PM</strong> | Llegada: <strong>01:49 PM</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">Asiento <strong>20B (Zona 3)</strong></span>
                  <span className="text-emerald-400 font-bold">Cubierto ✅</span>
                </div>
              </div>

              {/* Tramo 3 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1">
                      <Bus className="w-3.5 h-3.5" /> Tramo 3: Bus
                    </span>
                    <span className="text-[10px] text-slate-400">~24 km (Túnel)</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Aeropuerto JMC ➔ Medellín</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Buses blancos de enlace (Combuses Nutibara) en bahía de llegadas hacia <strong>San Diego / Centro</strong>.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Duración: <strong>40-45 min</strong></span>
                  <span className="text-blue-300 font-bold">$15.000 COP</span>
                </div>
              </div>

              {/* Tramo 4 */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                      <Train className="w-3.5 h-3.5" /> Tramo 4: Metro
                    </span>
                    <span className="text-[10px] text-slate-400">Líneas A/T-A</span>
                  </div>
                  <h5 className="text-sm font-bold text-white">Centro ➔ PAC San Antonio</h5>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Trámite de <strong>Tarjeta Cívica</strong> personalizada con cédula física en Punto de Atención al Cliente (PAC).
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Atención: <strong>hasta 6:45 PM</strong></span>
                  <span className="text-emerald-300 font-bold">Cédula original</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium">Efectivo en Mano</span>
              <div className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(med.cashInHand)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Físico para aterrizar en MDE</div>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-800 font-medium">Cajita Medayork (Nu)</span>
                <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.5 rounded-full font-bold">
                  9.35% E.A.
                </span>
              </div>
              <div className="text-lg font-bold text-purple-950 mt-1">{formatCurrency(med.nuBoxSavings)}</div>
              <div className="text-[11px] text-purple-700 mt-0.5">Rendimiento diario líquido</div>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80">
              <span className="text-xs text-teal-800 font-medium">Excedente Líquido Libre</span>
              <div className="text-lg font-bold text-teal-950 mt-1">{formatCurrency(realFreeSurplus)}</div>
              <div className="text-[11px] text-teal-700 mt-0.5">Líquido tras motilada (-$12k)</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <span className="text-xs text-emerald-800 font-medium">Capital Total Asegurado</span>
              <div className="text-lg font-bold text-emerald-950 mt-1">{formatCurrency(totalTripSecuredCapital)}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Colchón libre: +{formatCurrency(netTripSurplus)}</div>
            </div>
          </div>

          {/* Partidas Desglosadas del Viaje */}
          <div className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-600" />
              Desglose de Gastos del Viaje a Medellín (5 Días)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {med.items.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{item.category}</span>
                    <span className="text-[11px] text-slate-500">{item.description}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-slate-900 block">
                      {item.amount === 0 ? 'Cubierto' : formatCurrency(item.amount)}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        item.status === 'Cubierto'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Prioritario'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comandos Rápidos de Registro */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-indigo-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Comandos de Registro Rápido
                </h4>
                <p className="text-xs text-indigo-700">Toca para registrar un movimiento diario y recalcular los fondos automáticamente.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => handleQuickAdd('barber')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-xs font-bold text-amber-900 flex items-center gap-1.5 shadow-2xs hover:bg-amber-50/50 transition-all"
              >
                <Scissors className="w-3.5 h-3.5 text-amber-600" />
                Ejecutar Motilada (-$12.000 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('familySync')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-blue-200 hover:border-blue-400 text-xs font-bold text-blue-900 flex items-center gap-1.5 shadow-2xs hover:bg-blue-50/50 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                Recibir Fondos Padres (+$150.000 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('frida')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-emerald-200 hover:border-emerald-400 text-xs font-bold text-emerald-900 flex items-center gap-1.5 shadow-2xs hover:bg-emerald-50/50 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Cartera en Calle ($0.00 COP ✅)
              </button>
              <button
                onClick={() => handleQuickAdd('papa')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-purple-200 hover:border-purple-400 text-xs font-bold text-purple-900 flex items-center gap-1.5 shadow-2xs hover:bg-purple-50/50 transition-all"
              >
                <Bus className="w-3.5 h-3.5 text-purple-600" />
                Bus Rionegro ➔ Centro ($15.000 COP)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: CUENTAS POR COBRAR (PASEOS CANINOS) */}
      {/* ======================================================== */}
      {activeTab === 'cobros' && (
        <div className="mt-6 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div>
              <span className="text-xs font-bold text-amber-900 block">Total Pendiente por Cobrar</span>
              <span className="text-2xl font-black text-amber-950">{formatCurrency(med.receivablesTotal)}</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Al recaudar en Nequi, trasladar de inmediato a la <strong>Cajita Medayork de Nu</strong> para ganar intereses al 9.30% E.A.
              </p>
            </div>
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-xs">
              <Coins className="w-6 h-6" />
            </div>
          </div>

          <div className="space-y-3">
            {med.receivables.map((rec) => (
              <div key={rec.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{rec.client}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
                      {rec.dogName}
                    </span>
                    <span className="text-xs text-slate-400">• {rec.concept}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{rec.notes}</p>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-base font-extrabold text-slate-900 block">{formatCurrency(rec.amount)}</span>
                    <span className="text-[10px] text-amber-700 font-bold uppercase">{rec.status}</span>
                  </div>
                  <button
                    onClick={() => {
                      showNotice(`💰 Cobro de ${rec.client} marcado como recibido.`);
                    }}
                    className="cursor-pointer px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Registrar Pago
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: PRESUPUESTO MENSUAL GENERAL */}
      {/* ======================================================== */}
      {activeTab === 'general' && (
        <div className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Ingresos Mensuales</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(finance.monthlyIncome)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Nómina / Ingresos fijos</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Presupuesto Mensual</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">{formatCurrency(finance.monthlyBudget)}</div>
              <div className="text-[11px] text-slate-400 mt-1">Límite operativo de gastos</div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Gastos Acumulados</span>
              <div className="text-xl font-extrabold text-emerald-700 mt-1">{formatCurrency(finance.totalExpenses)}</div>
              <div className="text-[11px] text-slate-400 mt-1">
                Restante: <strong className="text-slate-700">{formatCurrency(remainingBudget)}</strong>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 mb-6">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-2">
              <span>Progreso del Presupuesto Mensual ({budgetPercentUsed}%)</span>
              <span>Disponible: {formatCurrency(remainingBudget)}</span>
            </div>
            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all rounded-full ${
                  budgetPercentUsed > 90 ? 'bg-rose-500' : budgetPercentUsed > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${budgetPercentUsed}%` }}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Últimos Gastos Registrados
            </h4>
            {finance.expenses.map((exp) => (
              <div key={exp.id} className="p-3.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">{exp.title}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {exp.category}
                    </span>
                    <span className="text-[10px] text-slate-400">{exp.date} • {exp.paymentMethod}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-slate-900">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
