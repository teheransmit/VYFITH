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
} from 'lucide-react';
import { initialFinanceData, FinanceSummary, ExpenseItem, ReceivableItem } from '@/lib/financeStore';

export default function FinanceSection() {
  const [finance, setFinance] = useState<FinanceSummary>(initialFinanceData);
  const [activeTab, setActiveTab] = useState<'general' | 'medellin' | 'cobros'>('medellin');
  const [quickNotice, setQuickNotice] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const remainingBudget = finance.monthlyBudget - finance.totalExpenses;
  const budgetPercentUsed = Math.min(100, Math.round((finance.totalExpenses / finance.monthlyBudget) * 100));

  // Cálculo del Viaje Medellín
  const med = finance.medellinTrip;
  const totalFundsAcumulables =
    med.liquidSavings + med.receivablesTotal + med.familyContributions - med.fixedMonthlyCosts;
  const tripCoveragePercent = Math.min(100, Math.round((totalFundsAcumulables / med.targetBudget) * 100));

  // Registrar un cobro o ingreso rápido
  const handleQuickAdd = (type: 'frida' | 'molly' | 'sienna' | 'papa') => {
    if (type === 'frida') {
      const added = 5850;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          receivablesTotal: prev.medellinTrip.receivablesTotal + added,
        },
      }));
      showNotice(`✅ +$5.850 COP sumados a cobros de Laura (Paseo de Frida).`);
    } else if (type === 'molly') {
      const added = 5000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          liquidSavings: prev.medellinTrip.liquidSavings + added,
        },
      }));
      showNotice(`✅ +$5.000 COP recibidos en efectivo/cuenta por Paseo de Molly.`);
    } else if (type === 'sienna') {
      const added = 9000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          receivablesTotal: prev.medellinTrip.receivablesTotal + added,
        },
      }));
      showNotice(`✅ +$9.000 COP sumados a cobros de Sienna.`);
    } else if (type === 'papa') {
      const added = 35000;
      setFinance((prev) => ({
        ...prev,
        medellinTrip: {
          ...prev.medellinTrip,
          familyContributions: prev.medellinTrip.familyContributions + added,
        },
      }));
      showNotice(`✅ +$35.000 COP de pasajes registrados.`);
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
                <span className="text-emerald-200">Capital Acumulable Proyectado: {formatCurrency(totalFundsAcumulables)}</span>
                <span className="text-emerald-300">Cobertura: {tripCoveragePercent}%</span>
              </div>
              <div className="w-full h-3.5 bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 to-teal-300 rounded-full transition-all"
                  style={{ width: `${tripCoveragePercent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-emerald-100/70 mt-2">
                <span>Saldo a favor proyectado: <strong>+{formatCurrency(med.projectedBuffer)} COP</strong> de colchón</span>
                <span className="text-emerald-300 font-bold">Estado: BIEN 🟢</span>
              </div>
            </div>
          </div>

          {/* Tarjetas de Desglose de Fondos */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-xs text-slate-500 font-medium">Saldo Líquido</span>
              <div className="text-lg font-bold text-slate-900 mt-1">{formatCurrency(med.liquidSavings)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">En cuenta / disponible</div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-800 font-medium">Cajita Medayork (Nu)</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded-full font-bold">
                  9.30% E.A.
                </span>
              </div>
              <div className="text-lg font-bold text-emerald-950 mt-1">{formatCurrency(med.nuBoxSavings)}</div>
              <div className="text-[11px] text-emerald-700 mt-0.5">Generando rendimientos diarios</div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-xs text-amber-800 font-medium">Por Cobrar en Calle</span>
              <div className="text-lg font-bold text-amber-950 mt-1">{formatCurrency(med.receivablesTotal)}</div>
              <div className="text-[11px] text-amber-700 mt-0.5">Paseos caninos (Laura / Sienna)</div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80">
              <span className="text-xs text-blue-800 font-medium">Aportes Familiares</span>
              <div className="text-lg font-bold text-blue-950 mt-1">{formatCurrency(med.familyContributions)}</div>
              <div className="text-[11px] text-blue-700 mt-0.5">Pasajes papá ($35k/sem) + apoyo</div>
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
                onClick={() => handleQuickAdd('frida')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-bold text-indigo-900 flex items-center gap-1.5 shadow-2xs hover:bg-indigo-50/50 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                Paseo Frida (+$$5.850 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('molly')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-bold text-indigo-900 flex items-center gap-1.5 shadow-2xs hover:bg-indigo-50/50 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                Paseo Molly (+$$5.000 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('sienna')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-bold text-indigo-900 flex items-center gap-1.5 shadow-2xs hover:bg-indigo-50/50 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                Paseo Sienna (+$$9.000 COP)
              </button>
              <button
                onClick={() => handleQuickAdd('papa')}
                className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-indigo-200 hover:border-indigo-400 text-xs font-bold text-indigo-900 flex items-center gap-1.5 shadow-2xs hover:bg-indigo-50/50 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
                Pasajes Papá (+$$35.000 COP)
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
