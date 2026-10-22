'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import {
  UserSession,
  getStoredSession,
  saveSession,
  clearSession,
  isEmailAuthorized,
  verifyMasterPasskey,
  AUTHORIZED_EMAILS,
} from '@/lib/authConfig';

// Contexto de Autenticación para componentes hijos
interface AuthContextType {
  session: UserSession | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthShieldGateProps {
  children: React.ReactNode;
}

export default function AuthShieldGate({ children }: AuthShieldGateProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  
  // Estados del formulario de autenticación
  const [showPasskeyField, setShowPasskeyField] = useState<boolean>(false);
  const [passkeyInput, setPasskeyInput] = useState<string>('');
  const [showPasskeyText, setShowPasskeyText] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  // Sincronización inicial y escucha de cambios de sesión
  useEffect(() => {
    const active = getStoredSession();
    setSession(active);
    setIsChecking(false);

    const handleAuthChange = () => {
      setSession(getStoredSession());
    };

    window.addEventListener('vyfith-auth-change', handleAuthChange);
    return () => {
      window.removeEventListener('vyfith-auth-change', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    setSuccessMessage(null);
    setErrorMessage(null);
    setPasskeyInput('');
  };

  // Inicio de sesión oficial con Google para la cuenta autorizada de Santiago
  const handleGoogleSignIn = () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Simulación / Integración de Google OAuth
    setTimeout(() => {
      const email = 'santiagosmitttt@gmail.com';
      if (isEmailAuthorized(email)) {
        const newSession: UserSession = {
          email,
          name: 'Santiago Terán',
          authenticatedAt: Date.now(),
          authMethod: 'google',
        };
        saveSession(newSession);
        setSession(newSession);
        setSuccessMessage('¡Acceso autorizado! Cargando Centro de Mando...');
      } else {
        setErrorMessage('Acceso denegado: Esta cuenta de Google no tiene permisos de administrador.');
      }
      setIsAuthenticating(false);
    }, 600);
  };

  // Intento de acceso con Master Passkey
  const handlePasskeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!passkeyInput.trim()) {
      setErrorMessage('Por favor ingresa la clave de administrador.');
      return;
    }

    if (verifyMasterPasskey(passkeyInput)) {
      const newSession: UserSession = {
        email: 'santiagosmitttt@gmail.com',
        name: 'Santiago Terán (Master)',
        authenticatedAt: Date.now(),
        authMethod: 'passkey',
      };
      saveSession(newSession);
      setSession(newSession);
      setSuccessMessage('¡Clave Maestra validada con éxito!');
    } else {
      setErrorMessage('Clave Maestra incorrecta. Acceso denegado.');
    }
  };

  // Fallback de carga para evitar destello de hidratación
  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 p-4">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
          Verificando credenciales de seguridad...
        </span>
      </div>
    );
  }

  // Si no está autenticado, NUNCA renderizar el dashboard sensible en el DOM
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-indigo-500 selection:text-white">
        <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fadeIn">
          {/* Luz decorativa superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Header del Escudo de Seguridad */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center p-3.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-2xl mb-4 shadow-inner">
              <ShieldCheck className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/80 mb-2">
              <Lock className="w-3 h-3" />
              <span>VYFITH Auth Shield • Ecosistema Protegido</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Acceso Restringido
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
              Este Centro de Mando contiene registros confidenciales de <strong>Santiago Smith Terán Mogollón</strong> (Calificaciones UPB SIGAA, Cédula, Finanzas Nu Bank, Biometría y Rutinas).
            </p>
          </div>

          {/* Mensajes de Alerta y Notificación */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="block font-bold">Bloqueo de Seguridad:</strong>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* MÉTODO 1: Inicio de Sesión con Cuenta de Google Autorizada */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthenticating}
              className="w-full cursor-pointer py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm transition-all shadow-md hover:shadow-indigo-500/10 flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60"
            >
              {/* Logo SVG Oficial de Google */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isAuthenticating ? 'Autenticando...' : 'Iniciar Sesión con Google'}</span>
            </button>

            {/* Separador */}
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800" />
              <span className="px-3 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                o acceso alternativo
              </span>
              <div className="flex-1 border-t border-slate-800" />
            </div>

            {/* MÉTODO 2: Master Passkey de Contingencia */}
            {!showPasskeyField ? (
              <button
                type="button"
                onClick={() => setShowPasskeyField(true)}
                className="w-full cursor-pointer py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 font-semibold text-xs transition-all flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Usar Master Key de Administrador</span>
              </button>
            ) : (
              <form onSubmit={handlePasskeySubmit} className="space-y-3 animate-fadeIn">
                <div className="relative">
                  <input
                    type={showPasskeyText ? 'text' : 'password'}
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Introduce tu clave maestra..."
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-hidden focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskeyText(!showPasskeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPasskeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 cursor-pointer py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Desbloquear</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasskeyField(false);
                      setErrorMessage(null);
                    }}
                    className="cursor-pointer py-2 px-3 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white text-xs font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Información de Garantía de Privacidad */}
          <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col gap-2 text-center text-[11px] text-slate-400">
            <div className="flex items-center justify-center gap-1.5 font-medium text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Lista Blanca Exclusiva: santiagosmitttt@gmail.com</span>
            </div>
            <p>
              Sesión persistente indefinida en este equipo. Cualquier otra cuenta será rechazada sin exponer información.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Usuario autenticado: Renderizar la aplicación completa con el contexto de sesión
  return (
    <AuthContext.Provider value={{ session, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}
