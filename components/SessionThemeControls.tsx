'use client';

import React from 'react';
import { Moon, Search, Sun } from 'lucide-react';
import UserSessionBadge from './UserSessionBadge';
import { UserSession } from '@/lib/authConfig';

interface SessionThemeControlsProps {
  session: UserSession | null;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenCommands?: () => void;
}

export default function SessionThemeControls({
  session,
  onLogout,
  isDarkMode,
  onToggleTheme,
  onOpenCommands,
}: SessionThemeControlsProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <UserSessionBadge session={session} onLogout={onLogout} />
      {onOpenCommands && (
        <button
          onClick={onOpenCommands}
          className="cursor-pointer px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-all flex items-center gap-1.5 sm:gap-2"
          title="Abrir buscador y comandos rápidos (Ctrl+K / Cmd+K)"
        >
          <Search className="w-4 h-4 text-indigo-500" />
          <span className="text-xs font-bold hidden sm:inline">Comandos</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-500">⌘K</kbd>
        </button>
      )}
      <button
        onClick={onToggleTheme}
        aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        className="cursor-pointer px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-xs transition-all flex items-center gap-1.5 sm:gap-2"
      >
        {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        <span className="text-xs font-bold hidden sm:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
      </button>
    </div>
  );
}
