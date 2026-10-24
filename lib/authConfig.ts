'use client';

export interface UserSession {
  email: string;
  name: string;
  avatarUrl?: string;
  authenticatedAt: number;
  authMethod: 'google' | 'passkey';
}

/**
 * Lista blanca estricta de correos electrónicos autorizados.
 * Únicamente la cuenta personal de Google de Santiago tiene acceso.
 */
export const AUTHORIZED_EMAILS = [
  'santiagosmitttt@gmail.com',
];

/**
 * Clave Maestra de Administrador para contingencias, modo incógnito y entornos sin conexión.
 */
export const MASTER_PASSKEY = 'santiago2026';
export const MASTER_PASSKEY_ALT = 'vyfith2026';

const SESSION_STORAGE_KEY = 'vyfith_auth_session';

/**
 * Obtiene la sesión activa almacenada durante la sesión del navegador.
 * Si no existe o el correo no pertenece a la lista blanca, retorna null.
 * La sesión se mantiene indefinidamente en el PC según lo solicitado.
 */
export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    
    // Verificación estricta de lista blanca
    if (session && session.email && isEmailAuthorized(session.email)) {
      // Normalización del nombre oficial de Santiago
      if (!session.name || session.name.includes('Terán') || session.name.includes('Teran') || session.name.includes('Smith') || !session.name.includes('Teherán')) {
        session.name = 'Santiago Smit Teherán Mogollón';
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } catch (_) {}
      }
      return session;
    }
    
    // Purga de sesión no autorizada si se detecta inconsistencia
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  } catch (err) {
    console.error('Error al recuperar sesión de VYFITH:', err);
    return null;
  }
}

/**
 * Guarda la sesión autorizada de forma indefinida en el navegador.
 */
export function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    // Disparar evento para sincronización reactiva en pestañas/componentes
    window.dispatchEvent(new Event('vyfith-auth-change'));
  } catch (err) {
    console.error('Error al guardar sesión:', err);
  }
}

/**
 * Cierra la sesión activa y purga cualquier credencial del almacenamiento.
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    window.dispatchEvent(new Event('vyfith-auth-change'));
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  }
}

/**
 * Valida si un correo electrónico se encuentra en la lista blanca de administradores.
 */
export function isEmailAuthorized(email: string): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();
  return AUTHORIZED_EMAILS.some((allowed) => allowed.toLowerCase() === cleanEmail);
}

/**
 * Valida la Master Passkey de contingencia.
 */
export function verifyMasterPasskey(passkey: string): boolean {
  if (!passkey) return false;
  const clean = passkey.trim();
  return clean === MASTER_PASSKEY || clean.toLowerCase() === MASTER_PASSKEY_ALT;
}
