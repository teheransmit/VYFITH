'use client';

import React, { useState } from 'react';
import {
  Wallet,
  PiggyBank,
  Sparkles,
} from 'lucide-react';
import { initialFinanceData, FinanceSummary } from '@/lib/financeStore';

export default function FinanceSection() {
  const [finance] = useState<FinanceSummary>(initialFinanceData);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const remainingBudget = finance.monthlyBudget - finance.totalExpenses;
  const budgetPercentUsed = Math.min(100, Math.round((finance.totalExpenses / finance.monthlyBudget) * 100));

  return (
    <section id="finance-section" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs mb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              Finanzas Personales & Open Banking
            </span>
            <span className="text-xs font-mono text-slate-400">Pilar 3: Economía & Presupuesto</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Control de Finanzas, Nutrición & Ahorro
          </h2>
          <p className="text-sm text-slate-500 max-w-2xl mt-1">
            Supervisa tus ingresos, presupuesto asignado para gimnasio/suplementos, gastos universitarios y tasa de ahorro mensual para mantener tu economía en equilibrio.
          </p>
        </div>

        {/* Tasa de Ahorro Badge */}
        <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl px-5 py-3">
          <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs">
            <PiggyBank className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block">
              Tasa de Ahorro Mensual
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-950">{finance.savingsRate}%</span>
              <span className="text-xs font-medium text-emerald-700">del ingreso total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Ingresos Mensuales</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(finance.monthlyIncome)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nómina / Ingresos fijos</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Presupuesto Mensual</span>
          <div className="text-xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(finance.monthlyBudget)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Límite operativo de gastos</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium">Gastos Acumulados</span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1">
            {formatCurrency(finance.totalExpenses)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Restante: <strong className="text-slate-700">{formatCurrency(remainingBudget)}</strong>
          </div>
        </div>
      </div>

      {/* Barra de Progreso del Presupuesto */}
      <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
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

      {/* Correlación Multivariable Finanzas + Salud */}
      <div className="my-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-emerald-50/80 border border-emerald-200/80 flex items-start gap-3">
        <div className="p-2 bg-emerald-600 text-white rounded-xl shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="text-xs text-emerald-950 leading-relaxed">
          <strong>Correlación IA (Finanzas vs Hipertrofia):</strong> El <strong>32.8%</strong> de tus gastos mensuales están destinados a combustible atlético (proteína aislada, creatina y mercado alto en nutrientes). Mantener este presupuesto reduce el gasto impulsivo en ocio o comida rápida nocturna en un <strong>-45%</strong>.
        </div>
      </div>

      {/* Lista de Gastos Recientes */}
      <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-4 py-3.5 font-semibold">Descripción del Gasto</th>
              <th className="px-4 py-3.5 font-semibold">Categoría</th>
              <th className="px-4 py-3.5 font-semibold">Método</th>
              <th className="px-4 py-3.5 font-semibold text-right">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {finance.expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-4 py-3.5 font-medium text-slate-900">
                  <div className="font-semibold text-slate-800">{exp.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{exp.date}</div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                    {exp.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-500 text-[11px]">{exp.paymentMethod}</td>
                <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                  {formatCurrency(exp.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
