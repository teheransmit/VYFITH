'use client';

import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { UserSession, clearSession } from '@/lib/authConfig';

interface UserSessionBadgeProps {
  session: UserSession | null;
  onLogout?: () => void;
}

export default function UserSessionBadge({ session, onLogout }: UserSessionBadgeProps) {
  if (!session) return null;

  const handleLogout = () => {
    clearSession();
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs">
      {/* Avatar o Iniciales */}
      <div className="relative">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
          ST
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
      </div>

      {/* Info de Usuario */}
      <div className="hidden sm:block text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
            {session.name && !session.name.includes('Terán') && !session.name.includes('Teran') ? session.name : 'Santiago Smit Teherán Mogollón'}
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        </div>
        <span className="text-[10px] text-slate-400 font-mono block leading-tight">
          {session.email}
        </span>
      </div>

      {/* Botón Cerrar Sesión */}
      <button
        onClick={handleLogout}
        title="Cerrar sesión y bloquear Centro de Mando"
        className="cursor-pointer ml-1 p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all flex items-center gap-1 text-xs font-semibold"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden md:inline text-[11px]">Cerrar Sesión</span>
      </button>
    </div>
  );
}
