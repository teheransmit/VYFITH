'use client';

import React, { useState, useEffect } from 'react';
import {
  Ruler,
  Scale,
  Sparkles,
  Camera,
  TrendingDown,
  TrendingUp,
  Save,
  CheckCircle2,
  Calendar,
  Layers,
  Info,
  Maximize2,
  Percent,
} from 'lucide-react';
import {
  BodyMeasurementEntry,
  calculateUsNavyBodyFatMen,
  calculateLeanBodyMass,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
} from '@/lib/hevyProEngine';

export default function BodyMeasurementsSuite() {
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>([]);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [weight, setWeight] = useState<number>(55.7);
  const [height, setHeight] = useState<number>(172.0);
  const [neck, setNeck] = useState<number>(36.5);
  const [waist, setWaist] = useState<number>(71.0);
  const [bodyFatManual, setBodyFatManual] = useState<string>('');
  const [shoulders, setShoulders] = useState<number>(110.0);
  const [chest, setChest] = useState<number>(92.5);
  const [bicepsLeft, setBicepsLeft] = useState<number>(30.5);
  const [bicepsRight, setBicepsRight] = useState<number>(31.0);
  const [forearmLeft, setForearmLeft] = useState<number>(26.0);
  const [forearmRight, setForearmRight] = useState<number>(26.5);
  const [abdomen, setAbdomen] = useState<number>(72.0);
  const [hips, setHips] = useState<number>(88.0);
  const [thighLeft, setThighLeft] = useState<number>(49.5);
  const [thighRight, setThighRight] = useState<number>(50.0);
  const [calfLeft, setCalfLeft] = useState<number>(33.5);
  const [calfRight, setCalfRight] = useState<number>(34.0);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  // Carga inicial
  useEffect(() => {
    fetch('/api/sync/measurements')
      .then((res) => res.json())
      .then((d) => {
        if (d.success && Array.isArray(d.data)) {
          setMeasurements(d.data);
          const latest = d.latest;
          if (latest) {
            setWeight(latest.weightKg || 55.7);
            setWaist(latest.waistCm || 71.0);
            setNeck(latest.neckCm || 36.5);
            setHeight(latest.heightCm || 172.0);
            if (latest.shouldersCm) setShoulders(latest.shouldersCm);
            if (latest.chestCm) setChest(latest.chestCm);
            if (latest.bicepsLeftCm) setBicepsLeft(latest.bicepsLeftCm);
            if (latest.bicepsRightCm) setBicepsRight(latest.bicepsRightCm);
            if (latest.forearmLeftCm) setForearmLeft(latest.forearmLeftCm);
            if (latest.forearmRightCm) setForearmRight(latest.forearmRightCm);
            if (latest.abdomenCm) setAbdomen(latest.abdomenCm);
            if (latest.hipsCm) setHips(latest.hipsCm);
            if (latest.thighLeftCm) setThighLeft(latest.thighLeftCm);
            if (latest.thighRightCm) setThighRight(latest.thighRightCm);
            if (latest.calfLeftCm) setCalfLeft(latest.calfLeftCm);
            if (latest.calfRightCm) setCalfRight(latest.calfRightCm);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Cálculos automáticos en tiempo real
  const computedBodyFat = calculateUsNavyBodyFatMen(waist, neck, height);
  const effectiveBodyFat = bodyFatManual !== '' && !isNaN(Number(bodyFatManual))
    ? Number(bodyFatManual)
    : computedBodyFat;
  const { lbmKg, lbmLbs } = calculateLeanBodyMass(weight, effectiveBodyFat);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        date: new Date().toISOString().slice(0, 10),
        weightKg: weight,
        waistCm: waist,
        neckCm: neck,
        heightCm: height,
        bodyFatPct: effectiveBodyFat,
        shouldersCm: shoulders,
        chestCm: chest,
        bicepsLeftCm: bicepsLeft,
        bicepsRightCm: bicepsRight,
        forearmLeftCm: forearmLeft,
        forearmRightCm: forearmRight,
        abdomenCm: abdomen,
        hipsCm: hips,
        thighLeftCm: thighLeft,
        thighRightCm: thighRight,
        calfLeftCm: calfLeft,
        calfRightCm: calfRight,
        photoUrl: photoPreview || undefined,
        notes,
      };

      const res = await fetch('/api/sync/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const d = await res.json();
      if (d.success) {
        setSuccessMsg('¡Medidas corporales y composición antropométrica guardadas!');
        setTimeout(() => setSuccessMsg(null), 4000);

        // Recargar histórico
        const updated = await fetch('/api/sync/measurements').then((r) => r.json());
        if (updated.success) setMeasurements(updated.data);
      }
    } catch (err) {
      console.error('Error saving measurements:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Comparativa Antes vs Después
  const oldest = measurements[0];
  const latest = measurements[measurements.length - 1];

  return (
    <div className="bg-[#0B0B0E] border border-[#262630] rounded-3xl p-6 sm:p-8 text-white space-y-7 shadow-2xl transition-colors">
      {/* 1. HEADER HEVY PRO MEDIDAS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#262630]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0088FF]/15 text-[#38BDF8] border border-[#0088FF]/30 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#0088FF]" />
              Hevy PRO • 17 Parámetros Antropométricos
            </span>
            <span className="text-xs font-mono text-slate-400">
              Fórmula Marina EE. UU. (US Navy Method) + Masa Magra
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Registro de Medidas Corporales & Fotos de Progreso
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Control de hipertrofia y simetría muscular con autocompletado inteligente de porcentaje de grasa y masa libre de grasa.
          </p>
        </div>

        {/* Selector de Unidades (kg/cm vs lbs/in) */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <div className="bg-[#16161D] p-1 rounded-xl border border-[#262630] flex items-center text-xs font-mono">
            <button
              onClick={() => setUnitSystem('metric')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                unitSystem === 'metric'
                  ? 'bg-[#0088FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Métrico (kg / cm)
            </button>
            <button
              onClick={() => setUnitSystem('imperial')}
              className={`cursor-pointer px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                unitSystem === 'imperial'
                  ? 'bg-[#0088FF] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Imperial (lbs / in)
            </button>
          </div>
        </div>
      </div>

      {/* 2. HUD DE COMPOSICIÓN CORPORAL CALCULADA EN TIEMPO REAL */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Peso Corporal</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-mono">
              {unitSystem === 'metric' ? weight.toFixed(1) : kgToLbs(weight).toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block mt-0.5">Báscula Femmto oficial</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">% Grasa Corporal</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-[#38BDF8] font-mono">
              {effectiveBodyFat.toFixed(1)}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">US Navy: {computedBodyFat}%</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Masa Magra (LBM)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {unitSystem === 'metric' ? lbmKg.toFixed(1) : lbmLbs.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">{unitSystem === 'metric' ? 'kg' : 'lbs'}</span>
          </div>
          <span className="text-[10px] text-emerald-500 font-mono block mt-0.5">Masa muscular activa</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Relación Cintura/Cuello</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-amber-300 font-mono">
              {(waist / neck).toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
            {waist / neck < 2.0 ? 'Ectomorfo Delgado' : 'Composición Normal'}
          </span>
        </div>
      </div>

      {/* 3. FORMULARIO DE 17 PARÁMETROS ANTROPOMÉTRICOS */}
      <div className="p-6 rounded-2xl bg-[#16161D]/80 border border-[#262630] space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4 text-[#0088FF]" />
            <h3 className="text-base font-bold text-white">Ingreso de Medidas ({unitSystem === 'metric' ? 'cm' : 'in'})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Actualizado hoy: {new Date().toLocaleDateString('es-CO')}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          {/* Fila 1: Parámetros Clave de Composición */}
          <div>
            <label className="text-slate-400 block mb-1">Peso ({unitSystem === 'metric' ? 'kg' : 'lbs'})</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? weight : kgToLbs(weight)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setWeight(unitSystem === 'metric' ? val : lbsToKg(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Cintura ({unitSystem === 'metric' ? 'cm' : 'in'})</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? waist : cmToIn(waist)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setWaist(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Cuello ({unitSystem === 'metric' ? 'cm' : 'in'})</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? neck : cmToIn(neck)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setNeck(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Estatura ({unitSystem === 'metric' ? 'cm' : 'in'})</label>
            <input
              type="number"
              step="0.5"
              value={unitSystem === 'metric' ? height : cmToIn(height)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setHeight(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">% Grasa (Manual/Bio)</label>
            <input
              type="number"
              step="0.1"
              placeholder={`${computedBodyFat}%`}
              value={bodyFatManual}
              onChange={(e) => setBodyFatManual(e.target.value)}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-[#38BDF8] font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Abdomen ({unitSystem === 'metric' ? 'cm' : 'in'})</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? abdomen : cmToIn(abdomen)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setAbdomen(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          {/* Fila 2: Tren Superior */}
          <div>
            <label className="text-slate-400 block mb-1">Hombros</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? shoulders : cmToIn(shoulders)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setShoulders(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Pecho</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? chest : cmToIn(chest)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setChest(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Bíceps Izq.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? bicepsLeft : cmToIn(bicepsLeft)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setBicepsLeft(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Bíceps Der.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? bicepsRight : cmToIn(bicepsRight)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setBicepsRight(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Antebrazo Izq.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? forearmLeft : cmToIn(forearmLeft)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setForearmLeft(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Antebrazo Der.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? forearmRight : cmToIn(forearmRight)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setForearmRight(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          {/* Fila 3: Tren Inferior */}
          <div>
            <label className="text-slate-400 block mb-1">Caderas</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? hips : cmToIn(hips)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setHips(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Muslo Izq.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? thighLeft : cmToIn(thighLeft)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setThighLeft(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Muslo Der.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? thighRight : cmToIn(thighRight)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setThighRight(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Pantorrilla Izq.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? calfLeft : cmToIn(calfLeft)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setCalfLeft(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Pantorrilla Der.</label>
            <input
              type="number"
              step="0.1"
              value={unitSystem === 'metric' ? calfRight : cmToIn(calfRight)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setCalfRight(unitSystem === 'metric' ? val : inToCm(val));
              }}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Asimetría Bíceps</label>
            <div className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-amber-300 font-mono text-center font-bold">
              {Math.abs(bicepsRight - bicepsLeft).toFixed(1)} cm
            </div>
          </div>
        </div>

        {/* Carga de Foto y Notas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-slate-400 text-xs block mb-1">Foto de Progreso (Comprimida en cliente)</label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#0B0B0E] border border-[#262630] hover:border-[#0088FF] text-xs font-mono text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0088FF]" />
                <span>Seleccionar Foto</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
              {photoPreview && (
                <div className="flex items-center gap-2">
                  <img src={photoPreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-[#0088FF]" />
                  <span className="text-[11px] text-emerald-400 font-mono">Foto cargada</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-slate-400 text-xs block mb-1">Notas de la sesión / Observaciones</label>
            <input
              type="text"
              placeholder="Ej: Medición en ayunas post-entrenamiento de empuje..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0B0B0E] border border-[#262630] rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-[#0088FF] focus:outline-none"
            />
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="flex items-center justify-between pt-2">
          {successMsg ? (
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">
              Los cambios se sincronizan en disco y se reflejan en el dashboard de Hevy PRO.
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="cursor-pointer px-6 py-2.5 rounded-xl bg-[#0088FF] hover:bg-[#0077E6] text-white text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-[#0088FF]/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Guardando...' : 'Guardar Medidas PRO'}</span>
          </button>
        </div>
      </div>

      {/* 4. GALERÍA COMPARATIVA ANTES VS DESPUÉS & HISTÓRICO */}
      <div className="p-6 rounded-2xl bg-[#16161D] border border-[#262630] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#38BDF8]" />
            <h3 className="text-base font-bold text-white">Evolución Cronológica (Antes vs. Después)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">{measurements.length} mediciones registradas</span>
        </div>

        {oldest && latest && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630]">
              <span className="text-[11px] text-slate-400 font-mono block">Delta Peso Corporal</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-white">
                  {(latest.weightKg - oldest.weightKg) >= 0 ? '+' : ''}
                  {(latest.weightKg - oldest.weightKg).toFixed(1)} kg
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  ({(((latest.weightKg - oldest.weightKg) / oldest.weightKg) * 100).toFixed(1)}%)
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                De {oldest.weightKg} kg ({oldest.date}) a {latest.weightKg} kg ({latest.date})
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630]">
              <span className="text-[11px] text-slate-400 font-mono block">Delta Grasa Corporal</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-[#38BDF8]">
                  {((latest.bodyFatPct || 0) - (oldest.bodyFatPct || 0)).toFixed(1)}%
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  {((latest.bodyFatPct || 0) <= (oldest.bodyFatPct || 0)) ? '↓ Reducción Óptima' : '↑ Volumen'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                De {oldest.bodyFatPct}% a {latest.bodyFatPct}%
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630]">
              <span className="text-[11px] text-slate-400 font-mono block">Delta Masa Magra (LBM)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-emerald-400">
                  +{((latest.leanBodyMassKg || 0) - (oldest.leanBodyMassKg || 0)).toFixed(1)} kg
                </span>
                <span className="text-xs text-emerald-400 font-mono font-bold">Músculo Neto</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                De {oldest.leanBodyMassKg} kg a {latest.leanBodyMassKg} kg
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
