'use client';

import React, { useEffect, useState } from 'react';
import { Utensils, Flame, Droplets, Smartphone, RefreshCw, Wheat, Beef, Droplet } from 'lucide-react';
import type { DailyNutritionState, MealType, FoodItem } from '@/lib/fitiaEngine';

const MEAL_ORDER: { key: MealType; label: string; emoji: string }[] = [
  { key: 'desayuno', label: 'Desayuno', emoji: '🌅' },
  { key: 'almuerzo', label: 'Almuerzo', emoji: '🍛' },
  { key: 'cena', label: 'Cena', emoji: '🌙' },
  { key: 'snacks', label: 'Snacks', emoji: '🍎' },
];

const SOURCE_LABEL: Record<string, string> = {
  plate_scan: 'Foto de plato',
  nlp_voice: 'Voz / texto',
  barcode: 'Código de barras',
  ocr_label: 'Etiqueta OCR',
  manual: 'Manual',
};

function pct(value: number, target: number) {
  if (!target) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

function Bar({ label, value, target, unit, color, icon }: {
  label: string; value: number; target: number; unit: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="bg-[#111116] border border-[#262630] rounded-2xl p-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span className="flex items-center gap-1.5 font-semibold">{icon}{label}</span>
        <span className="font-mono text-white">{Math.round(value)} / {Math.round(target)} {unit}</span>
      </div>
      <div className="h-2 rounded-full bg-[#1d1d26] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct(value, target)}%`, background: color }} />
      </div>
      <div className="text-[11px] text-gray-500 text-right">{pct(value, target)}%</div>
    </div>
  );
}

export default function FitiaNutritionSuite() {
  const [state, setState] = useState<DailyNutritionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/nutrition/log?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) { setState(d.data); setError(null); }
        else setError(d.error || 'Sin datos');
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const t = state?.targets;
  const c = state?.current;
  const updated = state?.lastUpdated ? new Date(state.lastUpdated).toLocaleString('es-CO') : '—';

  return (
    <div className="bg-[#0B0B0E] border border-[#262630] rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262630]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <Utensils className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Nutrición, Macros &amp; Calorías</h3>
            <p className="text-xs text-gray-400">Datos recibidos desde la app VYFITH del teléfono (solo lectura)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111116] border border-[#262630]">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Última sync: {updated}
          </span>
          <button onClick={load} className="p-1.5 rounded-lg border border-[#262630] hover:bg-[#1d1d26]" title="Actualizar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && !state && (
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          Aún no hay datos del teléfono: {error}
        </div>
      )}

      {t && c && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <Bar label="Calorías" value={c.calories} target={t.targetKcal} unit="kcal" color="#f97316" icon={<Flame className="w-3.5 h-3.5 text-orange-400" />} />
            <Bar label="Proteína" value={c.protein} target={t.targetProtein} unit="g" color="#ef4444" icon={<Beef className="w-3.5 h-3.5 text-red-400" />} />
            <Bar label="Carbohidratos" value={c.carbs} target={t.targetCarbs} unit="g" color="#eab308" icon={<Wheat className="w-3.5 h-3.5 text-yellow-400" />} />
            <Bar label="Grasas" value={c.fat} target={t.targetFat} unit="g" color="#a855f7" icon={<Droplet className="w-3.5 h-3.5 text-purple-400" />} />
            <Bar label="Hidratación" value={c.waterMl} target={t.targetWaterMl} unit="ml" color="#06b6d4" icon={<Droplets className="w-3.5 h-3.5 text-cyan-400" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MEAL_ORDER.map(({ key, label, emoji }) => {
              const meal = state?.meals?.[key];
              const items: FoodItem[] = meal?.items || [];
              return (
                <div key={key} className="bg-[#111116] border border-[#262630] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{emoji} {label}{meal?.time ? <span className="ml-2 text-xs text-gray-500">{meal.time}</span> : null}</span>
                    <span className="text-xs font-mono text-gray-300">
                      {meal?.totalKcal ?? 0} kcal · P{meal?.totalProtein ?? 0} C{meal?.totalCarbs ?? 0} G{meal?.totalFat ?? 0}
                    </span>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-xs text-gray-500">Sin registros enviados desde el teléfono.</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it, i) => (
                        <li key={it.id || i} className="flex items-start justify-between gap-3 text-xs border-t border-[#1d1d26] pt-2 first:border-0 first:pt-0">
                          <div>
                            <div className="text-gray-200 font-medium">{it.spanishName || it.name}</div>
                            <div className="text-gray-500">{it.portionDisplay} · {SOURCE_LABEL[it.source] || it.source}</div>
                          </div>
                          <div className="text-right font-mono text-gray-300 whitespace-nowrap">
                            {Math.round(it.calories)} kcal<br />
                            <span className="text-gray-500">P{it.protein} C{it.carbs} G{it.fat}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
