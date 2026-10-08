'use client';

import React, { useState, useEffect } from 'react';
import {
  Luggage,
  Wallet,
  MapPin,
  Music,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  Navigation,
  Bus,
  Car,
  Plane,
  Coffee,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  loadTravelState,
  saveTravelState,
  TravelState,
  ChecklistItem,
  TravelExpense,
  TravelMusicTrack,
} from '@/lib/travelStore';
import Rome2RioRouteMap from '@/components/Rome2RioRouteMap';

export default function MobileTravelDashboard() {
  const [state, setState] = useState<TravelState>(loadTravelState);
  const [activeTab, setActiveTab] = useState<'checklist' | 'finances' | 'route' | 'music'>('checklist');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Estados locales para nuevos registros
  const [newChecklistText, setNewChecklistText] = useState('');
  const [newExpenseConcept, setNewExpenseConcept] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseMethod, setNewExpenseMethod] = useState<'Efectivo' | 'Nu' | 'Nequi'>('Efectivo');
  const [newExpenseCategory, setNewExpenseCategory] = useState<'Transporte' | 'Alimentación' | 'Compras' | 'Salidas' | 'Imprevistos'>('Alimentación');
  const [newMusicTitle, setNewMusicTitle] = useState('');
  const [newMusicArtist, setNewMusicArtist] = useState('');
  const [newNotesText, setNewNotesText] = useState(state.notes);

  // Carga inicial y persistencia en localStorage
  useEffect(() => {
    const loaded = loadTravelState();
    setState(loaded);
    setNewNotesText(loaded.notes);
  }, []);

  const updateAndSave = (updater: (prev: TravelState) => TravelState) => {
    setState((prev) => {
      const next = updater(prev);
      saveTravelState(next);
      return next;
    });
  };

  // 1. Checklist Handlers
  const toggleChecklist = (id: string) => {
    updateAndSave((prev) => ({
      ...prev,
      checklist: prev.checklist.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item
      ),
    }));
  };

  const addChecklistItem = () => {
    if (!newChecklistText.trim()) return;
    const newItem: ChecklistItem = {
      id: `c-custom-${Date.now()}`,
      label: newChecklistText.trim(),
      done: false,
      category: 'equipaje',
    };
    updateAndSave((prev) => ({
      ...prev,
      checklist: [newItem, ...prev.checklist],
    }));
    setNewChecklistText('');
  };

  const removeChecklistItem = (id: string) => {
    updateAndSave((prev) => ({
      ...prev,
      checklist: prev.checklist.filter((item) => item.id !== id),
    }));
  };

  // 2. Gastos & Finanzas Handlers
  const addExpense = () => {
    const amt = parseFloat(newExpenseAmount);
    if (!newExpenseConcept.trim() || isNaN(amt) || amt <= 0) return;

    const newExp: TravelExpense = {
      id: `exp-${Date.now()}`,
      concept: newExpenseConcept.trim(),
      amount: amt,
      paymentMethod: newExpenseMethod,
      category: newExpenseCategory,
      timestamp: new Date().toISOString(),
    };

    updateAndSave((prev) => {
      let cash = prev.cashInHand;
      let nu = prev.nuSavings;
      let nequi = prev.nequiSavings;

      if (newExpenseMethod === 'Efectivo') {
        cash = Math.max(0, cash - amt);
      } else if (newExpenseMethod === 'Nu') {
        nu = Math.max(0, nu - amt);
      } else {
        nequi = Math.max(0, nequi - amt);
      }

      return {
        ...prev,
        cashInHand: cash,
        nuSavings: nu,
        nequiSavings: nequi,
        expenses: [newExp, ...prev.expenses],
      };
    });

    setNewExpenseConcept('');
    setNewExpenseAmount('');
    setSyncStatus(`💸 -$${amt.toLocaleString('es-CO')} registrado (${newExpenseConcept}). Guardado en celular.`);
    setTimeout(() => setSyncStatus(null), 3500);
  };

  const removeExpense = (id: string) => {
    updateAndSave((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // 3. Música Handlers
  const addMusicTrack = () => {
    if (!newMusicTitle.trim()) return;
    const newTrack: TravelMusicTrack = {
      id: `m-${Date.now()}`,
      title: newMusicTitle.trim(),
      artist: newMusicArtist.trim() || 'Desconocido',
      addedAt: new Date().toISOString().split('T')[0],
    };
    updateAndSave((prev) => ({
      ...prev,
      playlist: [newTrack, ...prev.playlist],
    }));
    setNewMusicTitle('');
    setNewMusicArtist('');
  };

  const removeMusicTrack = (id: string) => {
    updateAndSave((prev) => ({
      ...prev,
      playlist: prev.playlist.filter((t) => t.id !== id),
    }));
  };

  // 4. Notas Handler
  const saveNotes = () => {
    updateAndSave((prev) => ({
      ...prev,
      notes: newNotesText,
    }));
    setSyncStatus('📝 Notas guardadas en tu teléfono con éxito.');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // 5. Sincronización Bidireccional con API / Antigravity
  const syncWithCloud = async () => {
    setIsSyncing(true);
    setSyncStatus('Sincronizando con el Cerebro de Antigravity...');
    try {
      const res = await fetch('/api/sync/trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`✅ ¡Sincronizado con Antigravity! (Última sync: ${new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })})`);
      } else {
        setSyncStatus('⚠️ Guardado en celular. (Servidor no disponible para sync en la nube)');
      }
    } catch (err) {
      setSyncStatus('📱 Guardado localmente en tu celular (Modo Offline activo)');
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 4500);
    }
  };

  // 6. Copiar Reporte para la IA
  const copyReportForAI = () => {
    const totalSpent = state.expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const completedItems = state.checklist.filter((c) => c.done).length;

    const report = `📱 REPORTE DE VIAJE SANTIAGO (MEDELLÍN 2026):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 ESTADO FINANCIERO:
• Efectivo en mano: $${state.cashInHand.toLocaleString('es-CO')} COP
• Cajita Nu (9.35% E.A.): $${state.nuSavings.toLocaleString('es-CO')} COP
• Total gastado en viaje: $${totalSpent.toLocaleString('es-CO')} COP
• Gastos registrados: ${state.expenses.length} movimientos

🎒 MALETA & EQUIPAJE:
• ${completedItems} de ${state.checklist.length} elementos listos
• Termo de aluminio empacado VACÍO: ${state.checklist.find((c) => c.id === 'c13')?.done ? 'SÍ ✅' : 'PENDIENTE ⏳'}
• Compras D1/Ara: ${state.checklist.find((c) => c.id === 'c4')?.done ? 'SÍ ✅' : 'PENDIENTE ⏳'}

🎵 PLAYLIST DE VUELO:
${state.playlist.map((p, i) => `${i + 1}. ${p.title} - ${p.artist}`).join('\n')}

📍 DESTINO:
Calle 35, La Castellana (6.242847, -75.601348)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
(Copiado desde VYFITH Mobile para sincronización con Antigravity)`;

    navigator.clipboard.writeText(report);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  const checklistDoneCount = state.checklist.filter((c) => c.done).length;
  const checklistPercent = Math.round((checklistDoneCount / Math.max(1, state.checklist.length)) * 100);
  const totalSpent = state.expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="w-full max-w-md mx-auto bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 pb-20">
      {/* Barra de Estado Superior */}
      <div className="bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 p-4 border-b border-white/10 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <Plane className="w-4 h-4 rotate-45" />
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold block">
                Modo Viaje Medellín 2026
              </span>
              <h2 className="text-sm font-black text-white">Centro de Mando Móvil</h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={syncWithCloud}
              disabled={isSyncing}
              className="cursor-pointer p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-300 transition-all border border-white/10 flex items-center gap-1 text-xs font-bold"
              title="Sincronizar con el Cerebro"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="text-[11px] hidden sm:inline">Sync</span>
            </button>
            <button
              onClick={copyReportForAI}
              className="cursor-pointer p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition-all shadow-xs flex items-center gap-1 text-xs font-bold"
              title="Copiar Reporte para Antigravity"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-white" />}
              <span className="text-[11px] hidden sm:inline">Reporte</span>
            </button>
          </div>
        </div>

        {/* Resumen Compacto de Saldo y Progreso */}
        <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-white/10 text-center">
          <div className="bg-black/30 rounded-xl p-1.5 border border-white/5">
            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Efectivo</span>
            <span className="text-xs font-black text-emerald-300 font-mono">
              ${(state.cashInHand / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="bg-black/30 rounded-xl p-1.5 border border-white/5">
            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Cajita Nu</span>
            <span className="text-xs font-black text-purple-300 font-mono">
              ${(state.nuSavings / 1000).toFixed(0)}k
            </span>
          </div>
          <div className="bg-black/30 rounded-xl p-1.5 border border-white/5">
            <span className="text-[9px] text-slate-400 block uppercase font-semibold">Maleta</span>
            <span className="text-xs font-black text-amber-300 font-mono">
              {checklistPercent}%
            </span>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-2.5 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium flex items-center justify-between animate-fadeIn">
            <span>{syncStatus}</span>
            <button onClick={() => setSyncStatus(null)} className="font-bold text-xs ml-2">✕</button>
          </div>
        )}
      </div>

      {/* Pestañas de Navegación de Modo Viaje */}
      <div className="grid grid-cols-4 bg-slate-950/80 p-1.5 border-b border-slate-800 text-center text-xs">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`cursor-pointer py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'checklist' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Luggage className="w-4 h-4" />
          <span className="text-[10px]">Maleta ({checklistDoneCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('finances')}
          className={`cursor-pointer py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'finances' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span className="text-[10px]">Billetera</span>
        </button>
        <button
          onClick={() => setActiveTab('route')}
          className={`cursor-pointer py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'route' ? 'bg-teal-500/20 text-teal-300 border border-teal-400/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span className="text-[10px]">Ruta</span>
        </button>
        <button
          onClick={() => setActiveTab('music')}
          className={`cursor-pointer py-2 rounded-xl font-bold flex flex-col items-center gap-1 transition-all ${
            activeTab === 'music' ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Music className="w-4 h-4" />
          <span className="text-[10px]">Música</span>
        </button>
      </div>

      {/* CONTENIDO DE PESTAÑAS */}
      <div className="p-4 space-y-4">
        {/* ============================================================== */}
        {/* TAB 1: MALETA & CHECKLIST */}
        {/* ============================================================== */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Barra de Progreso */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-300">Equipaje & Requisitos Listos</span>
                <span className="text-emerald-300 font-mono">{checklistDoneCount} de {state.checklist.length}</span>
              </div>
              <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-linear-to-r from-emerald-400 to-teal-300 rounded-full transition-all"
                  style={{ width: `${checklistPercent}%` }}
                />
              </div>
            </div>

            {/* Agregar nuevo ítem personalizado */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Añadir ítem a la maleta..."
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-400"
              />
              <button
                onClick={addChecklistItem}
                className="cursor-pointer px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Lista Interactiva */}
            <div className="space-y-2">
              {state.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                    item.done
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-300'
                      : 'bg-white/5 border-white/10 text-white hover:border-white/20'
                  }`}
                >
                  <div
                    onClick={() => toggleChecklist(item.id)}
                    className="flex items-start gap-2.5 cursor-pointer flex-1 select-none"
                  >
                    <div className={`mt-0.5 ${item.done ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {item.done ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <span className={`text-xs leading-snug ${item.done ? 'line-through text-slate-400' : 'font-medium'}`}>
                      {item.label}
                    </span>
                  </div>
                  <button
                    onClick={() => removeChecklistItem(item.id)}
                    className="cursor-pointer text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BILLETERA & GASTOS */}
        {/* ============================================================== */}
        {activeTab === 'finances' && (
          <div className="space-y-4">
            {/* Tarjeta de Saldos */}
            <div className="p-4 rounded-2xl bg-linear-to-br from-emerald-900/60 to-slate-900 border border-emerald-500/30">
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block mb-1">
                Efectivo Físico Disponible
              </span>
              <div className="text-2xl font-black text-white font-mono">
                ${state.cashInHand.toLocaleString('es-CO')} <span className="text-xs text-slate-300 font-normal">COP</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-1">
                Colchón asegurado junto a Cajita Nu (${state.nuSavings.toLocaleString('es-CO')}).
              </p>
            </div>

            {/* Formulario Rápido para Añadir Gasto */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-amber-400" />
                Registrar Gasto Rápido en Medellín
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Concepto (ej. Almuerzo)"
                  value={newExpenseConcept}
                  onChange={(e) => setNewExpenseConcept(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400"
                />
                <input
                  type="number"
                  placeholder="Monto COP (ej. 15000)"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-amber-400 font-mono"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={newExpenseMethod}
                  onChange={(e) => setNewExpenseMethod(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-hidden"
                >
                  <option value="Efectivo">💵 Efectivo</option>
                  <option value="Nu">🟣 Cuenta Nu</option>
                  <option value="Nequi">📱 Nequi</option>
                </select>

                <select
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-white/15 text-xs text-white focus:outline-hidden"
                >
                  <option value="Alimentación">🍲 Comida</option>
                  <option value="Transporte">🚌 Transporte</option>
                  <option value="Compras">🛍️ Compras</option>
                  <option value="Salidas">🎟️ Salidas</option>
                  <option value="Imprevistos">⚠️ Imprevisto</option>
                </select>

                <button
                  onClick={addExpense}
                  className="flex-1 cursor-pointer py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-xs"
                >
                  Guardar
                </button>
              </div>
            </div>

            {/* Historial de Gastos */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Historial de Gastos ({state.expenses.length}) — Total: ${totalSpent.toLocaleString('es-CO')} COP
              </span>
              {state.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{exp.concept}</span>
                    <span className="text-[10px] text-slate-400">
                      {exp.paymentMethod} • {exp.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-300 font-mono">
                      -${exp.amount.toLocaleString('es-CO')}
                    </span>
                    <button
                      onClick={() => removeExpense(exp.id)}
                      className="cursor-pointer text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: RUTA & MOVILIDAD */}
        {/* ============================================================== */}
        {activeTab === 'route' && (
          <div className="space-y-4">
            {/* Mapa Interactivo */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-md">
              <Rome2RioRouteMap />
            </div>

            {/* Tarjeta de Destino Airbnb */}
            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider block">
                  Airbnb en Medellín
                </span>
                <h5 className="text-xs font-black text-white">Calle 35, La Castellana</h5>
                <p className="text-[10px] text-slate-300 mt-0.5 font-mono">
                  Coords: 6.242847, -75.601348
                </p>
              </div>
              <a
                href="https://www.google.com/maps/search/?api=1&query=6.2428473868837395,-75.601347826038"
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs"
              >
                <span>Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Resumen de los 5 Tramos */}
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-amber-400 font-bold block">1. Casa ➔ MTR Los Garzones (10:25 AM)</span>
                <span className="text-[11px] text-slate-300">Transporte familiar directo (Gratis $0 COP).</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-teal-300 font-bold block">2. Vuelo JetSMART JA5483 (12:48 PM)</span>
                <span className="text-[11px] text-slate-300">Asiento 20B (Zona 3). Llegada a MDE: 1:49 PM.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-blue-300 font-bold block">3. Bus Blanco MDE ➔ San Diego ($15.000 COP)</span>
                <span className="text-[11px] text-slate-300">Por Túnel de Oriente (40 min). Bájate en San Diego.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-purple-300 font-bold block">4. Taxi San Diego ➔ Airbnb (~$12.000 COP)</span>
                <span className="text-[11px] text-slate-300">Por Calle 33 directo a La Castellana. ¡A pie no renta!</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs">
                <span className="text-emerald-400 font-bold block">5. Tarjeta Cívica en Metro San Antonio</span>
                <span className="text-[11px] text-slate-300">PAC atiende hasta 6:45 PM con cédula física original.</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: MÚSICA & NOTAS */}
        {/* ============================================================== */}
        {activeTab === 'music' && (
          <div className="space-y-4">
            {/* Playlist de Vuelo */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-400" />
                Playlist de Vuelo & Paseos
              </h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Canción..."
                  value={newMusicTitle}
                  onChange={(e) => setNewMusicTitle(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-purple-400"
                />
                <input
                  type="text"
                  placeholder="Artista..."
                  value={newMusicArtist}
                  onChange={(e) => setNewMusicArtist(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-purple-400"
                />
                <button
                  onClick={addMusicTrack}
                  className="cursor-pointer px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                {state.playlist.map((track) => (
                  <div
                    key={track.id}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{track.title}</span>
                      <span className="text-[10px] text-slate-400">{track.artist}</span>
                    </div>
                    <button
                      onClick={() => removeMusicTrack(track.id)}
                      className="cursor-pointer text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas Rápidas del Viajero */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white">Notas & Datos Clave del Viaje</h4>
                <button
                  onClick={saveNotes}
                  className="cursor-pointer px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold"
                >
                  Guardar Nota
                </button>
              </div>
              <textarea
                rows={5}
                value={newNotesText}
                onChange={(e) => setNewNotesText(e.target.value)}
                className="w-full p-3 rounded-xl bg-black/30 border border-white/15 text-xs text-slate-200 font-mono leading-relaxed focus:outline-hidden focus:border-emerald-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
