// lib/googleCalendar.ts
// Gestión cliente-side de autenticación y lectura de eventos de Google Calendar

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

let cachedAccessToken: string | null = null;
let cachedUser: { displayName: string | null; email: string | null; photoURL: string | null } | null = null;

// Inicializador seguro para evitar fallos de renderizado en servidor (SSR)
async function getFirebaseAuthClient() {
  if (typeof window === 'undefined') return null;
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
    
    let config: Record<string, string> = {
      projectId: "gen-lang-client-0463513688",
      authDomain: "gen-lang-client-0463513688.firebaseapp.com",
      appId: "1:956922204718:web:aistudio",
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyForGoogleCalendarOAuth",
    };

    try {
      const appletConfig = await import('../firebase-applet-config.json');
      config = { ...config, ...appletConfig.default };
    } catch {
      // Ignorar si el json no está disponible
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/calendar.events.readonly');

    return { auth, provider };
  } catch (err) {
    console.warn('Error inicializando Firebase Auth:', err);
    return null;
  }
}

export const initCalendarAuth = (
  onAuthSuccess?: (user: { displayName: string | null; email: string | null; photoURL: string | null }, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (typeof window === 'undefined') return () => {};

  getFirebaseAuthClient().then((client) => {
    if (!client) {
      if (onAuthFailure) onAuthFailure();
      return;
    }
    const { onAuthStateChanged } = require('firebase/auth');
    return onAuthStateChanged(client.auth, (user: any) => {
      if (user && cachedAccessToken) {
        cachedUser = {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        if (onAuthSuccess) onAuthSuccess(cachedUser, cachedAccessToken);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    });
  });

  return () => {};
};

export const signInWithGoogleCalendar = async (): Promise<{
  user: { displayName: string | null; email: string | null; photoURL: string | null };
  accessToken: string;
} | null> => {
  const client = await getFirebaseAuthClient();
  if (!client) {
    throw new Error('No se pudo inicializar el cliente de autenticación.');
  }

  const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
  const result = await signInWithPopup(client.auth, client.provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  if (!credential?.accessToken) {
    throw new Error('No se pudo obtener el token de acceso de Google Calendar.');
  }

  cachedAccessToken = credential.accessToken;
  cachedUser = {
    displayName: result.user.displayName,
    email: result.user.email,
    photoURL: result.user.photoURL,
  };

  return { user: cachedUser, accessToken: cachedAccessToken };
};

export const getCalendarAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogleCalendar = async () => {
  const client = await getFirebaseAuthClient();
  if (client) {
    const { signOut } = await import('firebase/auth');
    await signOut(client.auth);
  }
  cachedAccessToken = null;
  cachedUser = null;
};

export async function fetchUserCalendarEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=25`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Calendar API (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return (data.items || []) as CalendarEvent[];
}
