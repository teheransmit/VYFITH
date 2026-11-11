'use client';

import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Camera,
  Mic,
  Barcode,
  Sparkles,
  Flame,
  Droplets,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Scale,
} from 'lucide-react';
import { DailyNutritionState, FoodItem, MealType } from '@/lib/fitiaEngine';

export default function FitiaNutritionSuite() {
  const [nutritionState, setNutritionState] = useState<DailyNutritionState | null>(null);
  const [activeMode, setActiveMode] = useState<'plate' | 'voice_text' | 'barcode_ocr'>('plate');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('almuerzo');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modo 1: Foto del Plato
  const [plateImagePreview, setPlateImagePreview] = useState<string | null>(null);
  const [plateDetectedItems, setPlateDetectedItems] = useState<FoodItem[]>([]);
  const [plateVerdict, setPlateVerdict] = useState<string | null>(null);

  // Modo 2: Texto o Voz Natural
  const [naturalText, setNaturalText] = useState<string>(
    'Comí un plato de arroz, un poquito de pollo asado y medio aguacate'
  );
  const [nlpDetectedItems, setNlpDetectedItems] = useState<FoodItem[]>([]);

  // Modo 3: Código de Barras / OCR
  const [barcodeInput, setBarcodeInput] = useState<string>('3017620422003');
  const [barcodeProduct, setBarcodeProduct] = useState<any | null>(null);
  const [ocrImagePreview, setOcrImagePreview] = useState<string | null>(null);
  const [ocrFoodItem, setOcrFoodItem] = useState<FoodItem | null>(null);

  // Cargar estado inicial
  const loadState = () => {
    fetch(`/api/nutrition/log?t=${Date.now()}`)
      .then((res) => res.json())
      .then((d) => {
        if (d.success && d.data) {
          setNutritionState(d.data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    loadState();
  }, []);

  // 1. Manejador Foto del Plato
  const handlePlatePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPlateImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePlatePhoto = async () => {
    if (!plateImagePreview) {
      setStatusMsg({ type: 'error', text: 'Toma o sube una foto del plato primero.' });
      return;
    }
    setIsAnalyzing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'plate',
          imageBase64: plateImagePreview,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPlateDetectedItems(d.items || []);
        if (d.plateSummary?.verdict) setPlateVerdict(d.plateSummary.verdict);
        setStatusMsg({
          type: 'success',
          text: `¡Plato analizado con IA! Se detectaron ${d.items?.length || 0} alimentos (${d.plateSummary?.totalKcal || 0} kcal).`,
        });
      } else {
        setStatusMsg({ type: 'error', text: d.error || 'Error al analizar la imagen del plato.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Manejador Texto o Voz Natural
  const analyzeNaturalText = async () => {
    if (!naturalText.trim()) return;
    setIsAnalyzing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'text_voice',
          text: naturalText,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setNlpDetectedItems(d.items || []);
        setStatusMsg({
          type: 'success',
          text: `Texto procesado con éxito. Se tradujeron ${d.items?.length || 0} ingredientes.`,
        });
      } else {
        setStatusMsg({ type: 'error', text: d.error || 'No se pudieron interpretar los alimentos.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 3. Manejador Código de Barras (Open Food Facts v2)
  const lookupBarcode = async () => {
    if (!barcodeInput.trim()) return;
    setIsAnalyzing(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/nutrition/barcode?barcode=${encodeURIComponent(barcodeInput.trim())}`);
      const d = await res.json();
      if (d.success && d.data) {
        setBarcodeProduct(d.data);
        setStatusMsg({
          type: 'success',
          text: `Producto encontrado en Open Food Facts: ${d.data.name} (${d.data.brand})`,
        });
      } else {
        setBarcodeProduct(null);
        setStatusMsg({
          type: 'error',
          text: d.message || 'Producto no encontrado en Open Food Facts. Usa la Vía B (OCR de etiqueta).',
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 4. Manejador OCR Etiqueta Nutricional
  const handleOcrPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setOcrImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeOcrLabel = async () => {
    if (!ocrImagePreview) return;
    setIsAnalyzing(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'ocr_label',
          imageBase64: ocrImagePreview,
        }),
      });
      const d = await res.json();
      if (d.success && d.foodItem) {
        setOcrFoodItem(d.foodItem);
        setStatusMsg({
          type: 'success',
          text: `OCR procesado exitosamente: ${d.foodItem.name} (${d.foodItem.calories} kcal).`,
        });
      } else {
        setStatusMsg({ type: 'error', text: d.error || 'No se pudo leer la tabla nutricional.' });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error de conexión.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Guardar Alimento en Comida
  const logItemToMeal = async (item: FoodItem) => {
    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: selectedMealType,
          item,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setNutritionState(d.data);
        setStatusMsg({
          type: 'success',
          text: `¡"${item.spanishName}" agregado a ${selectedMealType.toUpperCase()}!`,
        });
        setTimeout(() => setStatusMsg(null), 3500);
      }
    } catch (err) {
      console.error('Error logging meal item:', err);
    }
  };

  // Registrar consumo de agua
  const addWater = async (deltaMl: number) => {
    try {
      const res = await fetch('/api/nutrition/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_water', deltaMl }),
      });
      const d = await res.json();
      if (d.success) {
        setNutritionState(d.data);
      }
    } catch (err) {
      console.error('Error adding water:', err);
    }
  };

  const targets = nutritionState?.targets || {
    targetKcal: 2500,
    targetProtein: 115,
    targetCarbs: 330,
    targetFat: 65,
    targetWaterMl: 2900,
  };

  const current = nutritionState?.current || {
    calories: 1820,
    protein: 88.5,
    carbs: 235.0,
    fat: 46.2,
    waterMl: 2000,
  };

  const kcalPct = Math.min(100, Math.round((current.calories / targets.targetKcal) * 100));
  const protPct = Math.min(100, Math.round((current.protein / targets.targetProtein) * 100));
  const carbsPct = Math.min(100, Math.round((current.carbs / targets.targetCarbs) * 100));
  const fatPct = Math.min(100, Math.round((current.fat / targets.targetFat) * 100));
  const waterPct = Math.min(100, Math.round((current.waterMl / targets.targetWaterMl) * 100));

  return (
    <div className="bg-[#0B0B0E] border border-[#262630] rounded-3xl p-6 sm:p-8 text-white space-y-7 shadow-2xl transition-colors">
      {/* 1. HEADER FITIA PREMIUM */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#262630]">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              Fitia Premium Desbloqueado • Motor Nutricional con IA
            </span>
            <span className="text-xs font-mono text-slate-400">
              Gemini 2.5 Flash Vision + Open Food Facts v2
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Escáner Nutricional, Macros & Calorías
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Reconocimiento volumétrico de platos colombianos, analizador de texto/voz y lector de código de barras a costo cero.
          </p>
        </div>

        {/* Destino de la comida a registrar */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <span className="text-xs text-slate-400 font-mono">Agregar a:</span>
          <div className="bg-[#16161D] p-1 rounded-xl border border-[#262630] flex items-center text-xs font-mono">
            {(['desayuno', 'almuerzo', 'cena', 'snacks'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMealType(m)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                  selectedMealType === m
                    ? 'bg-[#10B981] text-[#0B0B0E] shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. HUD DE MACRONUTRIENTES Y CALORÍAS (SUPERÁVIT ECTOMORFO) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Calorías */}
        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Calorías Totales</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-white font-mono">{current.calories}</span>
            <span className="text-xs text-slate-400 font-mono">/ {targets.targetKcal} kcal</span>
          </div>
          <div className="h-1.5 w-full bg-[#0B0B0E] rounded-full overflow-hidden mt-2">
            <div style={{ width: `${kcalPct}%` }} className="h-full bg-amber-400 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono block mt-1">
            {targets.targetKcal - current.calories > 0
              ? `Faltan ${targets.targetKcal - current.calories} kcal`
              : 'Meta cumplida'}
          </span>
        </div>

        {/* Proteínas */}
        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Proteínas (2.06 g/kg)</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-[#10B981] font-mono">{current.protein}</span>
            <span className="text-xs text-slate-400 font-mono">/ {targets.targetProtein} g</span>
          </div>
          <div className="h-1.5 w-full bg-[#0B0B0E] rounded-full overflow-hidden mt-2">
            <div style={{ width: `${protPct}%` }} className="h-full bg-[#10B981] rounded-full" />
          </div>
          <span className="text-[10px] text-emerald-400 font-mono block mt-1">{protPct}% de la meta</span>
        </div>

        {/* Carbohidratos */}
        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Carbohidratos</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-sky-400 font-mono">{current.carbs}</span>
            <span className="text-xs text-slate-400 font-mono">/ {targets.targetCarbs} g</span>
          </div>
          <div className="h-1.5 w-full bg-[#0B0B0E] rounded-full overflow-hidden mt-2">
            <div style={{ width: `${carbsPct}%` }} className="h-full bg-sky-400 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono block mt-1">{carbsPct}% completado</span>
        </div>

        {/* Grasas */}
        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630]">
          <span className="text-xs text-slate-400 font-mono block">Grasas Saludables</span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-rose-400 font-mono">{current.fat}</span>
            <span className="text-xs text-slate-400 font-mono">/ {targets.targetFat} g</span>
          </div>
          <div className="h-1.5 w-full bg-[#0B0B0E] rounded-full overflow-hidden mt-2">
            <div style={{ width: `${fatPct}%` }} className="h-full bg-rose-400 rounded-full" />
          </div>
          <span className="text-[10px] text-slate-400 font-mono block mt-1">{fatPct}% completado</span>
        </div>

        {/* Hidratación */}
        <div className="p-4 rounded-2xl bg-[#16161D] border border-[#262630] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Hidratación</span>
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-cyan-400 font-mono">{current.waterMl}</span>
            <span className="text-xs text-slate-400 font-mono">/ {targets.targetWaterMl} ml</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <button
              onClick={() => addWater(250)}
              className="cursor-pointer px-2 py-1 rounded-md bg-[#0B0B0E] hover:bg-[#262630] text-[10px] font-mono text-cyan-300 border border-cyan-500/30"
            >
              +250ml
            </button>
            <button
              onClick={() => addWater(500)}
              className="cursor-pointer px-2 py-1 rounded-md bg-[#0B0B0E] hover:bg-[#262630] text-[10px] font-mono text-cyan-300 border border-cyan-500/30"
            >
              +500ml Termo
            </button>
          </div>
        </div>
      </div>

      {/* 3. SELECTOR DE MODOS FITIA PREMIUM */}
      <div className="flex items-center gap-2 border-b border-[#262630] pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveMode('plate')}
          className={`cursor-pointer px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
            activeMode === 'plate'
              ? 'bg-[#10B981] text-[#0B0B0E]'
              : 'text-slate-400 hover:text-white bg-[#16161D]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Modo 1: Foto del Plato (Visión IA)</span>
        </button>

        <button
          onClick={() => setActiveMode('voice_text')}
          className={`cursor-pointer px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
            activeMode === 'voice_text'
              ? 'bg-[#10B981] text-[#0B0B0E]'
              : 'text-slate-400 hover:text-white bg-[#16161D]'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Modo 2: Texto o Voz Natural</span>
        </button>

        <button
          onClick={() => setActiveMode('barcode_ocr')}
          className={`cursor-pointer px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all ${
            activeMode === 'barcode_ocr'
              ? 'bg-[#10B981] text-[#0B0B0E]'
              : 'text-slate-400 hover:text-white bg-[#16161D]'
          }`}
        >
          <Barcode className="w-4 h-4" />
          <span>Modo 3: Código de Barras / OCR</span>
        </button>
      </div>

      {/* 4. CONTENIDO DEL MODO SELECCIONADO */}
      <div className="p-6 rounded-2xl bg-[#16161D] border border-[#262630] space-y-5">
        {/* ========================================================================= */}
        {/* MODO 1: ESCÁNER DE PLATO POR FOTO */}
        {/* ========================================================================= */}
        {activeMode === 'plate' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#10B981]" />
                  <span>Escáner IA de Platos y Comidas</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toma una foto de tu almuerzo o cena; Gemini 2.5 Flash estimará los gramos volumétricos y macros.
                </p>
              </div>

              <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#0B0B0E] border border-[#262630] hover:border-[#10B981] text-xs font-mono text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#10B981]" />
                <span>Subir / Tomar Foto</span>
                <input type="file" accept="image/*" onChange={handlePlatePhotoChange} className="hidden" />
              </label>
            </div>

            {plateImagePreview && (
              <div className="flex flex-col sm:flex-row gap-4 items-start p-4 rounded-xl bg-[#0B0B0E] border border-[#262630]">
                <img
                  src={plateImagePreview}
                  alt="Plato"
                  className="w-32 h-32 object-cover rounded-xl border border-[#10B981]"
                />
                <div className="space-y-2 flex-1">
                  <span className="text-xs text-slate-300 font-mono block">
                    Foto lista para analizar con el modelo de visión clínica.
                  </span>
                  <button
                    onClick={analyzePlatePhoto}
                    disabled={isAnalyzing}
                    className="cursor-pointer px-5 py-2 rounded-xl bg-[#10B981] hover:bg-[#0EA271] text-[#0B0B0E] font-bold text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAnalyzing ? 'Analizando plato con IA...' : 'Analizar Plato con Gemini Flash'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Alimentos detectados en el plato */}
            {plateDetectedItems.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono text-[#10B981] font-bold block">
                  Ingredientes Identificados en el Plato:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plateDetectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{item.spanishName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.portionDisplay}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300 pt-1">
                          <span className="text-amber-300">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-[#10B981]">{item.protein}g P</span>
                          <span>•</span>
                          <span className="text-sky-400">{item.carbs}g C</span>
                          <span>•</span>
                          <span className="text-rose-400">{item.fat}g G</span>
                        </div>
                      </div>

                      <button
                        onClick={() => logItemToMeal(item)}
                        className="cursor-pointer p-2 rounded-lg bg-[#16161D] hover:bg-[#10B981] hover:text-[#0B0B0E] text-slate-300 border border-[#262630] transition-all"
                        title={`Agregar a ${selectedMealType}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO 2: TEXTO O VOZ NATURAL */}
        {/* ========================================================================= */}
        {activeMode === 'voice_text' && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#10B981]" />
                <span>Analizador de Lenguaje Natural (Texto & Dictado)</span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Escribe o dicta lo que comiste con expresiones caseras colombianas (ej: "1 plato de arroz, un poquito de pollo...").
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={naturalText}
                onChange={(e) => setNaturalText(e.target.value)}
                placeholder="Escribe lo que comiste..."
                className="flex-1 bg-[#0B0B0E] border border-[#262630] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-[#10B981] focus:outline-none"
              />
              <button
                onClick={analyzeNaturalText}
                disabled={isAnalyzing}
                className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#0EA271] text-[#0B0B0E] font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isAnalyzing ? 'Traduciendo...' : 'Interpretar Macros'}</span>
              </button>
            </div>

            {nlpDetectedItems.length > 0 && (
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono text-[#10B981] font-bold block">
                  Desglose Traducido a Gramos & Macros:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {nlpDetectedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#0B0B0E] border border-[#262630] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-white block">{item.spanishName}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{item.portionDisplay}</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300 pt-1">
                          <span className="text-amber-300">{item.calories} kcal</span>
                          <span>•</span>
                          <span className="text-[#10B981]">{item.protein}g P</span>
                          <span>•</span>
                          <span className="text-sky-400">{item.carbs}g C</span>
                          <span>•</span>
                          <span className="text-rose-400">{item.fat}g G</span>
                        </div>
                      </div>

                      <button
                        onClick={() => logItemToMeal(item)}
                        className="cursor-pointer p-2 rounded-lg bg-[#16161D] hover:bg-[#10B981] hover:text-[#0B0B0E] text-slate-300 border border-[#262630] transition-all"
                        title={`Agregar a ${selectedMealType}`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODO 3: CÓDIGO DE BARRAS & OCR */}
        {/* ========================================================================= */}
        {activeMode === 'barcode_ocr' && (
          <div className="space-y-5 animate-fadeIn">
            {/* VÍA A: Código de barras con Open Food Facts */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-bold text-[#10B981] block">
                Vía A: Consulta Directa a Open Food Facts v2 (Gratis / 0 Tokens)
              </span>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Ingresa código de barras (ej: 3017620422003)"
                  className="flex-1 bg-[#0B0B0E] border border-[#262630] rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:border-[#10B981] focus:outline-none"
                />
                <button
                  onClick={lookupBarcode}
                  disabled={isAnalyzing}
                  className="cursor-pointer px-5 py-2.5 rounded-xl bg-[#0088FF] hover:bg-[#0077E6] text-white font-bold text-xs font-mono flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  <span>Consultar OFF</span>
                </button>
              </div>

              {barcodeProduct && (
                <div className="p-4 rounded-xl bg-[#0B0B0E] border border-[#262630] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white text-sm block">{barcodeProduct.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{barcodeProduct.brand} • {barcodeProduct.servingSize}</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300 pt-1">
                      <span className="text-amber-300">{barcodeProduct.perServing.calories} kcal/porción</span>
                      <span>•</span>
                      <span className="text-[#10B981]">{barcodeProduct.perServing.protein}g P</span>
                      <span>•</span>
                      <span className="text-sky-400">{barcodeProduct.perServing.carbs}g C</span>
                      <span>•</span>
                      <span className="text-rose-400">{barcodeProduct.perServing.fat}g G</span>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      logItemToMeal({
                        id: `food-off-${Date.now()}`,
                        name: barcodeProduct.name,
                        spanishName: barcodeProduct.name,
                        portionDisplay: barcodeProduct.servingSize,
                        grams: barcodeProduct.servingGrams,
                        calories: barcodeProduct.perServing.calories,
                        protein: barcodeProduct.perServing.protein,
                        carbs: barcodeProduct.perServing.carbs,
                        fat: barcodeProduct.perServing.fat,
                        source: 'barcode',
                        barcode: barcodeProduct.barcode,
                      })
                    }
                    className="cursor-pointer px-4 py-2 rounded-xl bg-[#10B981] hover:bg-[#0EA271] text-[#0B0B0E] font-bold font-mono flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar a {selectedMealType}</span>
                  </button>
                </div>
              )}
            </div>

            {/* VÍA B: OCR para etiqueta nutricional */}
            <div className="space-y-3 pt-3 border-t border-[#262630]">
              <span className="text-xs font-mono font-bold text-amber-300 block">
                Vía B: Foto de Etiqueta Nutricional (OCR con Gemini Vision)
              </span>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-[#0B0B0E] border border-[#262630] hover:border-amber-400 text-xs font-mono text-slate-300 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span>Subir Foto de Tabla Nutricional</span>
                  <input type="file" accept="image/*" onChange={handleOcrPhotoChange} className="hidden" />
                </label>
                {ocrImagePreview && (
                  <button
                    onClick={analyzeOcrLabel}
                    disabled={isAnalyzing}
                    className="cursor-pointer px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-[#0B0B0E] font-bold text-xs font-mono flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isAnalyzing ? 'Leyendo...' : 'Extraer Tabla con OCR'}</span>
                  </button>
                )}
              </div>

              {ocrFoodItem && (
                <div className="p-4 rounded-xl bg-[#0B0B0E] border border-[#262630] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">{ocrFoodItem.name}</span>
                    <span className="text-slate-400 font-mono text-[11px]">{ocrFoodItem.portionDisplay}</span>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300 pt-1">
                      <span className="text-amber-300">{ocrFoodItem.calories} kcal</span>
                      <span>•</span>
                      <span className="text-[#10B981]">{ocrFoodItem.protein}g P</span>
                      <span>•</span>
                      <span className="text-sky-400">{ocrFoodItem.carbs}g C</span>
                    </div>
                  </div>
                  <button
                    onClick={() => logItemToMeal(ocrFoodItem)}
                    className="cursor-pointer px-4 py-2 rounded-xl bg-[#10B981] text-[#0B0B0E] font-bold font-mono flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mensaje de Estado / Notificación */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-mono flex items-center gap-2 animate-fadeIn ${
              statusMsg.type === 'success'
                ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}
      </div>

      {/* 5. BITÁCORA DE COMIDAS DEL DÍA (DESAYUNO, ALMUERZO, CENA, SNACKS) */}
      <div className="p-6 rounded-2xl bg-[#16161D] border border-[#262630] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#10B981]" />
            <h3 className="text-base font-bold text-white">Comidas Registradas Hoy (11 de Noviembre, 2026)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {Object.values(nutritionState?.meals || {}).reduce((acc, m) => acc + m.items.length, 0)} alimentos
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(['desayuno', 'almuerzo', 'cena', 'snacks'] as const).map((mKey) => {
            const meal = nutritionState?.meals[mKey];
            const hasItems = meal && meal.items.length > 0;
            return (
              <div key={mKey} className="p-4 rounded-xl bg-[#0B0B0E] border border-[#262630] space-y-3">
                <div className="flex items-center justify-between border-b border-[#262630] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase font-mono">{mKey}</span>
                    {meal?.time && <span className="text-[10px] text-slate-400 font-mono">({meal.time})</span>}
                  </div>
                  <span className="text-xs font-bold font-mono text-amber-300">
                    {meal?.totalKcal || 0} kcal
                  </span>
                </div>

                {hasItems ? (
                  <div className="space-y-2">
                    {meal.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">{it.spanishName} ({it.grams}g)</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-[#10B981]">{it.protein}g P</span>
                          <span>{it.calories} kcal</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono block italic">
                    Sin alimentos registrados aún.
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
