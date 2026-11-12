'use client';

import React, { useEffect, useState } from 'react';
import { Droplets, Smartphone, RefreshCw, CheckCircle2 } from 'lucide-react';

interface WaterEntry { id: string; ml: number; time: string }
interface WaterDay { date: string; totalMl: number; goalMl: number; entries: WaterEntry[]; lastUpdated: string | null }
interface WaterResp { success: boolean; goalMl: number; today: WaterDay; history: WaterDay[]; lastSync: string | null; error?: string }

export default function WaterIntakeSuite() {
  const [data, setData] = useState<WaterResp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/water?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) { setData(d); setError(null); } else setError(d.error || 'Sin datos'); })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const today = data?.today;
  const goal = today?.goalMl || data?.goalMl || 3000;
  const total = today?.totalMl || 0;
  const pct = Math.min(100, Math.round((total / goal) * 100));
  const reached = total >= goal;
  const last7 = (data?.history || []).slice(-7);
  const maxMl = Math.max(goal, ...last7.map((d) => d.totalMl), 1);
  const sync = data?.lastSync ? new Date(data.lastSync).toLocaleString('es-CO') : 'Sin sincronizar';
  const glasses = Math.round((total / 250) * 10) / 10;

  return (
    <div className="bg-[#0B0B0E] border border-[#262630] rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262630]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
            <Droplets className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Hidratación diaria</h3>
            <p className="text-xs text-gray-400">Agua registrada en la app VYFITH del teléfono (solo lectura)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111116] border border-[#262630]">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" /> Última sync: {sync}
          </span>
          <button onClick={load} className="p-1.5 rounded-lg border border-[#262630] hover:bg-[#1d1d26]" title="Actualizar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && !data && (
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">Aún no hay datos de agua: {error}</div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 flex flex-col items-center justify-center gap-3 bg-[#111116] border border-[#262630] rounded-2xl p-5">
            <div className="relative w-36 h-36 rounded-full border-4 border-[#1d1d26] overflow-hidden bg-[#0B0B0E]">
              <div className="absolute bottom-0 left-0 right-0 transition-all duration-700" style={{ height: `${pct}%`, background: 'linear-gradient(180deg,#22d3ee,#0891b2)' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold font-mono drop-shadow">{pct}%</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold font-mono">{total} <span className="text-sm text-gray-400">/ {goal} ml</span></div>
              <div className="text-xs text-gray-400 mt-1">≈ {glasses} vasos de 250 ml</div>
              {reached ? (
                <div className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Meta del día cumplida</div>
              ) : (
                <div className="mt-2 text-xs text-gray-500">Faltan {Math.max(0, goal - total)} ml</div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#111116] border border-[#262630] rounded-2xl p-4">
              <div className="text-xs font-semibold text-gray-400 mb-3">Últimos 7 días</div>
              {last7.length === 0 ? (
                <p className="text-xs text-gray-500">Sin historial aún.</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {last7.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <span className="text-[10px] font-mono text-gray-400">{d.totalMl}</span>
                      <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, (d.totalMl / maxMl) * 100)}%`, background: d.totalMl >= d.goalMl ? '#10b981' : '#06b6d4' }} />
                      <span className="text-[10px] text-gray-500 font-mono">{d.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#111116] border border-[#262630] rounded-2xl p-4">
              <div className="text-xs font-semibold text-gray-400 mb-2">Registros de hoy</div>
              {(today?.entries?.length ?? 0) === 0 ? (
                <p className="text-xs text-gray-500">La app envió solo el total del día (sin desglose por toma).</p>
              ) : (
                <ul className="space-y-1.5 max-h-40 overflow-auto">
                  {today!.entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between text-xs border-b border-[#1d1d26] pb-1.5 last:border-0">
                      <span className="text-gray-400 font-mono">{new Date(e.time).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-mono text-cyan-300">+{e.ml} ml</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
