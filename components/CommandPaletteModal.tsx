'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sparkles,
  Heart,
  Dumbbell,
  Calendar,
  GraduationCap,
  Footprints,
  CreditCard,
  User,
  ArrowRight,
  BookOpen,
  Clock,
  Activity,
  Layers,
  X,
  Keyboard,
  Scale,
} from 'lucide-react';
import { DASHBOARD_NAV_ITEMS } from '@/lib/navigation';

export interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Pilar Principal' | 'Acción Rápida' | 'Universidad & Academia';
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
}

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onNavigate,
}: CommandPaletteModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commandItems: CommandItem[] = [
    ...DASHBOARD_NAV_ITEMS.map((item) => ({
      id: `nav-${item.id}`,
      title: item.commandTitle,
      subtitle: item.commandSubtitle,
      category: 'Pilar Principal' as const,
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
      action: () => {
        onNavigate(item.id);
        onClose();
      },
      badge: item.badge,
    })),
    // Acciones Rápidas
    {
      id: 'action-gym-status',
      title: 'Verificar Estado del Gimnasio UPB',
      subtitle: 'Consultar si el gym climatizado está abierto ahora y huecos de clase',
      category: 'Acción Rápida',
      icon: <Clock className="w-4 h-4 text-rose-500" />,
      action: () => {
        onNavigate('health');
        onClose();
      },
      badge: 'Gimnasio',
    },
    {
      id: 'action-sync-health',
      title: 'Sincronizar Salud Google Health Connect',
      subtitle: 'Recepción de telemetría biométrica desde Vivo Y20 (V2027) / Xiaomi Band 9 Pro',
      category: 'Acción Rápida',
      icon: <Activity className="w-4 h-4 text-emerald-500" />,
      action: () => {
        onNavigate('health');
        onClose();
      },
      badge: 'LAN 192.168.1.8',
    },
    {
      id: 'action-femmto-scale',
      title: 'Báscula Femmto: Composición Corporal y Peso',
      subtitle: '55.7 kg • 10.6% grasa • 25.1 kg MME • Historial de 27 pesajes y evolución',
      category: 'Salud & Biometría',
      icon: <Scale className="w-4 h-4 text-teal-500" />,
      action: () => {
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '?tab=health&sub=femmto');
        }
        onNavigate('health');
        onClose();
      },
      badge: 'Báscula Femmto',
      title: 'Sobrecarga Progresiva de Hevy (14.280 kg)',
      subtitle: 'Examinar series efectivas, tonelaje y progresión de cargas',
      category: 'Acción Rápida',
      icon: <Dumbbell className="w-4 h-4 text-purple-500" />,
      action: () => {
        onNavigate('health');
        onClose();
      },
      badge: 'Hevy',
    },
    {
      id: 'action-estructuras-target',
      title: 'Meta Examen Final de Análisis Estructural',
      subtitle: 'Calcular nota requerida (2.97 / 3.00) para habilitar Concreto I',
      category: 'Universidad & Academia',
      icon: <GraduationCap className="w-4 h-4 text-amber-500" />,
      action: () => {
        onNavigate('grades');
        onClose();
      },
      badge: 'NRC 52885',
    },
    {
      id: 'action-nu-yield',
      title: 'Cajita Nu Bank (9.30% E.A.)',
      subtitle: 'Comprobar capital acumulado y rendimiento diario en pesos',
      category: 'Acción Rápida',
      icon: <CreditCard className="w-4 h-4 text-purple-500" />,
      action: () => {
        onNavigate('finance');
        onClose();
      },
      badge: 'Ahorro Nu',
    },
  ];

  const filteredItems = commandItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      const resetId = window.setTimeout(() => {
        setQuery('');
        setSelectedIndex(0);
        inputRef.current?.focus();
      }, 50);
      return () => window.clearTimeout(resetId);
    }
  }, [isOpen]);

  useEffect(() => {
    const resetId = window.setTimeout(() => setSelectedIndex(0), 0);
    return () => window.clearTimeout(resetId);
  }, [query]);

  // Manejo de teclado dentro del modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-4 sm:pt-24 px-3 sm:px-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[80vh] transition-all"
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de Comandos Ejecutiva"
      >
        {/* Barra de Entrada de Búsqueda */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Escribe para buscar o saltar a cualquier pilar (ej. Hevy, Nu, Notas, Gym)..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="cursor-pointer p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Resultados Filtrados */}
        <div className="overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No se encontraron comandos o pilares coincidentes con &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`cursor-pointer p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isSelected
                          ? 'bg-white dark:bg-slate-900 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            isSelected
                              ? 'text-indigo-950 dark:text-indigo-200'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected
                        ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5'
                        : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* Footer del Modal con Atajos de Teclado */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">↓</kbd>
              <span>Navegar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">Enter</kbd>
              <span>Ejecutar</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-[10px]">Esc</kbd>
              <span>Cerrar</span>
            </span>
          </div>
          <span className="hidden sm:inline text-indigo-500 dark:text-indigo-400 font-semibold">
            Inspirado en sahnia3/life-os
          </span>
        </div>
      </div>
    </div>
  );
}
