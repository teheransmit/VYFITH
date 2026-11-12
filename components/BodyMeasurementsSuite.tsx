'use client';

import React, { useEffect, useState } from 'react';
import { Ruler, Scale, Smartphone, RefreshCw, Layers, Percent, Camera } from 'lucide-react';
import type { BodyMeasurementEntry } from '@/lib/hevyProEngine';

const FIELDS: { key: keyof BodyMeasurementEntry; label: string }[] = [
  { key: 'neckCm', label: 'Cuello' },
  { key: 'shouldersCm', label: 'Hombros' },
  { key: 'chestCm', label: 'Pecho' },
  { key: 'bicepsLeftCm', label: 'Bíceps izq.' },
  { key: 'bicepsRightCm', label: 'Bíceps der.' },
  { key: 'forearmLeftCm', label: 'Antebrazo izq.' },
  { key: 'forearmRightCm', label: 'Antebrazo der.' },
  { key: 'waistCm', label: 'Cintura' },
  { key: 'abdomenCm', label: 'Abdomen' },
  { key: 'hipsCm', label: 'Cadera' },
  { key: 'thighLeftCm', label: 'Muslo izq.' },
  { key: 'thighRightCm', label: 'Muslo der.' },
  { key: 'calfLeftCm', label: 'Pantorrilla izq.' },
  { key: 'calfRightCm', label: 'Pantorrilla der.' },
];

function Stat({ label, value, unit }: { label: string; value?: number; unit: string }) {
  return (
    <div className="bg-[#111116] border border-[#262630] rounded-2xl p-4">
      <div className="text-[11px] text-gray-400 font-mono">{label}</div>
      <div className="text-xl font-bold font-mono text-white mt-1">
        {value !== undefined && value !== null ? Number(value).toFixed(1) : '—'} <span className="text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );
}

export default function BodyMeasurementsSuite() {
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/sync/measurements?t=${Date.now()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) { setMeasurements(d.data); setError(null); }
        else setError(d.error || 'Sin datos');
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const oldest = measurements[0];
  const latest = measurements[measurements.length - 1];
  const photos = measurements.filter((m) => m.photoUrl);
  const updated = latest?.timestamp ? new Date(latest.timestamp).toLocaleString('es-CO') : '—';
  const delta = (a?: number, b?: number) => ((a ?? 0) - (b ?? 0));

  return (
    <div className="bg-[#0B0B0E] border border-[#262630] rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262630]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30">
            <Ruler className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Medidas Corporales &amp; Progreso</h3>
            <p className="text-xs text-gray-400">Datos recibidos desde la app VYFITH del teléfono (solo lectura)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-gray-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#111116] border border-[#262630]">
            <Smartphone className="w-3.5 h-3.5 text-sky-400" /> Última medición: {updated}
          </span>
          <button onClick={load} className="p-1.5 rounded-lg border border-[#262630] hover:bg-[#1d1d26]" title="Actualizar">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && measurements.length === 0 && (
        <div className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          Aún no hay medidas del teléfono: {error}
        </div>
      )}

      {latest && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="Peso" value={latest.weightKg} unit="kg" />
            <Stat label="Grasa corporal (US Navy)" value={latest.bodyFatPct} unit="%" />
            <Stat label="Masa magra" value={latest.leanBodyMassKg} unit="kg" />
            <Stat label="Estatura" value={latest.heightCm} unit="cm" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {FIELDS.map((f) => (
              <Stat key={f.key as string} label={f.label} value={latest[f.key] as number | undefined} unit="cm" />
            ))}
          </div>

          {latest.notes ? (
            <div className="text-xs text-gray-300 bg-[#111116] border border-[#262630] rounded-xl p-3">
              📝 {latest.notes}
            </div>
          ) : null}
        </>
      )}

      {oldest && latest && measurements.length > 1 && (
        <div className="p-5 rounded-2xl bg-[#16161D] border border-[#262630] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h4 className="text-sm font-bold">Evolución (primera vs. última)</h4>
            </div>
            <span className="text-xs text-gray-400 font-mono">{measurements.length} mediciones</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630]">
              <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1"><Scale className="w-3 h-3" />Peso</span>
              <div className="text-xl font-bold font-mono mt-1">{delta(latest.weightKg, oldest.weightKg) >= 0 ? '+' : ''}{delta(latest.weightKg, oldest.weightKg).toFixed(1)} kg</div>
              <span className="text-[10px] text-gray-500 font-mono">{oldest.weightKg} → {latest.weightKg} kg</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630]">
              <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1"><Percent className="w-3 h-3" />Grasa corporal</span>
              <div className="text-xl font-bold font-mono mt-1">{delta(latest.bodyFatPct, oldest.bodyFatPct).toFixed(1)}%</div>
              <span className="text-[10px] text-gray-500 font-mono">{oldest.bodyFatPct}% → {latest.bodyFatPct}%</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630]">
              <span className="text-[11px] text-gray-400 font-mono">Masa magra</span>
              <div className="text-xl font-bold font-mono mt-1">{delta(latest.leanBodyMassKg, oldest.leanBodyMassKg) >= 0 ? '+' : ''}{delta(latest.leanBodyMassKg, oldest.leanBodyMassKg).toFixed(1)} kg</div>
              <span className="text-[10px] text-gray-500 font-mono">{oldest.leanBodyMassKg} → {latest.leanBodyMassKg} kg</span>
            </div>
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold"><Camera className="w-4 h-4 text-sky-400" /> Fotos de progreso</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.slice(-8).map((m) => (
              <figure key={m.id} className="rounded-xl overflow-hidden border border-[#262630] bg-[#111116]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.photoUrl} alt={`Progreso ${m.date}`} className="w-full h-40 object-cover" />
                <figcaption className="text-[11px] text-gray-400 font-mono p-2">{m.date} · {m.weightKg} kg</figcaption>
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
