// lib/googleCalendar.ts
// Gestión cliente-side de autenticación y lectura de eventos de Google Calendar

export interface CalendarAttendee {
  email?: string;
  responseStatus?: 'accepted' | 'declined' | 'tentative' | 'needsAction' | string;
  self?: boolean;
  organizer?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  status?: string;
  attendees?: CalendarAttendee[];
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

/**
 * Estado visual de asistencia en Google Calendar según el Auto-Invite de Santiago:
 * - 'attended': Con color sólido (respondió "Sí" / accepted, o evento sin auto-invite pintado sólido) -> Fui / Voy a ir (Suma ganancia)
 * - 'unconfirmed': Sin color / solo borde hueco (needsAction o tentative) -> No ha confirmado aún
 * - 'declined': Tachado y sin relleno (respondió "No" / declined o cancelado) -> No fui / No voy ($0 ganancia)
 */
export type CalendarRsvpVisualState = 'attended' | 'unconfirmed' | 'declined';

export function getEventRsvpState(evt: CalendarEvent): {
  visualState: CalendarRsvpVisualState;
  rawStatus: 'accepted' | 'needsAction' | 'tentative' | 'declined' | 'solid_no_invite';
  visualLabel: string;
} {
  if (evt.status === 'cancelled') {
    return {
      visualState: 'declined',
      rawStatus: 'declined',
      visualLabel: 'Tachado • No fui ($0)',
    };
  }

  if (Array.isArray(evt.attendees) && evt.attendees.length > 0) {
    const selfAttendee =
      evt.attendees.find((a) => a.self || a.email?.toLowerCase() === 'santiagosmitttt@gmail.com') ||
      evt.attendees[0];
    const status = selfAttendee?.responseStatus || 'needsAction';

    if (status === 'accepted') {
      return {
        visualState: 'attended',
        rawStatus: 'accepted',
        visualLabel: 'Con color • Sí fui / Confirmado',
      };
    }
    if (status === 'declined') {
      return {
        visualState: 'declined',
        rawStatus: 'declined',
        visualLabel: 'Tachado • No fui / Cancelado',
      };
    }
    if (status === 'tentative') {
      return {
        visualState: 'unconfirmed',
        rawStatus: 'tentative',
        visualLabel: 'Sin color • Tal vez (Sin confirmar)',
      };
    }
    return {
      visualState: 'unconfirmed',
      rawStatus: 'needsAction',
      visualLabel: 'Sin color • Pendiente por confirmar',
    };
  }

  // Evento sin auto-invite: Google Calendar lo pinta con relleno sólido de color
  return {
    visualState: 'attended',
    rawStatus: 'solid_no_invite',
    visualLabel: 'Con color • Programado activo',
  };
}

export interface WalkCalendarLedgerItem {
  id: string;
  summary: string;
  dogName: 'Frida' | 'Sienna';
  clientName: 'Laura' | 'Elena';
  isoDate: string; // YYYY-MM-DD
  startTimestamp: number;
  dayName: string; // 'Lunes'
  shortDateLabel: string; // 'Lun 16 Nov'
  timeLabel: string; // '06:30'
  shiftLabel: 'Mañana' | 'Tarde';
  visualState: CalendarRsvpVisualState;
  rawStatus: 'accepted' | 'needsAction' | 'tentative' | 'declined' | 'solid_no_invite';
  visualLabel: string;
  rate: number;
  earnedAmount: number; // Suma si visualState === 'attended'
  pendingAmount: number; // Suma si visualState === 'unconfirmed'
  lostAmount: number; // Monto descartado si visualState === 'declined'
  isCurrentWeek: boolean;
  isNextWeek: boolean;
  hasAlreadyPassed: boolean;
}

export interface CalendarWalksIncomeSummary {
  weekRangeLabel: string;
  weekMondayIso: string;
  weekSundayIso: string;
  fridaRate: number;
  siennaRate: number;
  // Todos los paseos de la semana actual (Lun - Dom)
  currentWeekWalks: WalkCalendarLedgerItem[];
  // Paseos de la próxima semana
  nextWeekWalks: WalkCalendarLedgerItem[];
  // Todos los paseos del mes
  allMonthWalks: WalkCalendarLedgerItem[];
  // Totales de la semana actual (según regla de color de Santiago)
  weeklyConfirmedIncome: number; // Con color (Fui o voy a ir)
  weeklyAlreadyDoneIncome: number; // Con color y cuya hora ya pasó
  weeklyUpcomingColoredIncome: number; // Con color en días restantes de esta semana
  weeklyUnconfirmedIncome: number; // Sin color (por confirmar)
  weeklyDeclinedLostIncome: number; // Tachados ($0 cobrados)
  weeklyMaxPotentialIncome: number; // Confirmados + Sin confirmar
  // Conteos de la semana actual
  weeklyTotalEvents: number;
  weeklyConfirmedCount: number;
  weeklyUnconfirmedCount: number;
  weeklyDeclinedCount: number;
  // Desglose por perrita en la semana actual
  fridaWeekly: {
    confirmedCount: number;
    unconfirmedCount: number;
    declinedCount: number;
    confirmedIncome: number;
    unconfirmedIncome: number;
    declinedLost: number;
  };
  siennaWeekly: {
    confirmedCount: number;
    unconfirmedCount: number;
    declinedCount: number;
    confirmedIncome: number;
    unconfirmedIncome: number;
    declinedLost: number;
  };
  // Totales acumulados del mes
  monthlyConfirmedIncome: number;
  monthlyUnconfirmedIncome: number;
  monthlyConfirmedCount: number;
  monthlyUnconfirmedCount: number;
  monthlyDeclinedCount: number;
}

export function computeWalksIncomeFromCalendar(
  events: CalendarEvent[],
  options?: {
    fridaRate?: number;
    siennaRate?: number;
    referenceDate?: Date;
  }
): CalendarWalksIncomeSummary {
  const fridaRate = options?.fridaRate ?? 5000;
  const siennaRate = options?.siennaRate ?? 9000;
  const now = options?.referenceDate ?? new Date();

  // Calcular Lunes y Domingo de la semana actual (Lunes = inicio de semana)
  const dayOfWeek = now.getDay(); // 0 = Dom, 1 = Lun, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  const nextMonday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7, 0, 0, 0, 0);
  const nextSunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 13, 23, 59, 59, 999);

  const toIsoDate = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const weekMondayIso = toIsoDate(monday);
  const weekSundayIso = toIsoDate(sunday);

  const fmtShortDate = (d: Date) => {
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`;
  };
  const fullDays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  const weekRangeLabel = `${fmtShortDate(monday)} — ${fmtShortDate(sunday)} ${sunday.getFullYear()}`;

  const walkItems: WalkCalendarLedgerItem[] = [];

  for (const evt of events) {
    const summaryText = (evt.summary || '').trim();
    const lower = summaryText.toLowerCase();
    const isFrida = lower.includes('frida');
    const isSienna = lower.includes('sienna');
    if (!isFrida && !isSienna) continue;

    const startRaw = evt.start?.dateTime || evt.start?.date;
    if (!startRaw) continue;

    const startDate = startRaw.includes('T')
      ? new Date(startRaw)
      : new Date(Number(startRaw.slice(0, 4)), Number(startRaw.slice(5, 7)) - 1, Number(startRaw.slice(8, 10)));

    if (isNaN(startDate.getTime())) continue;

    const dogName: 'Frida' | 'Sienna' = isFrida ? 'Frida' : 'Sienna';
    const clientName: 'Laura' | 'Elena' = isFrida ? 'Laura' : 'Elena';
    const rate = isFrida ? fridaRate : siennaRate;

    const hours = startDate.getHours();
    const mins = startDate.getMinutes();
    const timeLabel = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const shiftLabel: 'Mañana' | 'Tarde' =
      lower.includes('tarde') || hours >= 12 ? 'Tarde' : 'Mañana';

    const rsvp = getEventRsvpState(evt);
    const ts = startDate.getTime();
    const isCurrentWeek = ts >= monday.getTime() && ts <= sunday.getTime();
    const isNextWeek = ts >= nextMonday.getTime() && ts <= nextSunday.getTime();
    const hasAlreadyPassed = ts <= now.getTime();

    walkItems.push({
      id: evt.id || `${dogName}-${startRaw}`,
      summary: summaryText,
      dogName,
      clientName,
      isoDate: toIsoDate(startDate),
      startTimestamp: ts,
      dayName: fullDays[startDate.getDay()],
      shortDateLabel: fmtShortDate(startDate),
      timeLabel,
      shiftLabel,
      visualState: rsvp.visualState,
      rawStatus: rsvp.rawStatus,
      visualLabel: rsvp.visualLabel,
      rate,
      earnedAmount: rsvp.visualState === 'attended' ? rate : 0,
      pendingAmount: rsvp.visualState === 'unconfirmed' ? rate : 0,
      lostAmount: rsvp.visualState === 'declined' ? rate : 0,
      isCurrentWeek,
      isNextWeek,
      hasAlreadyPassed,
    });
  }

  walkItems.sort((a, b) => a.startTimestamp - b.startTimestamp);

  const currentWeekWalks = walkItems.filter((w) => w.isCurrentWeek);
  const nextWeekWalks = walkItems.filter((w) => w.isNextWeek);

  // Filtrar mes actual
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const allMonthWalks = walkItems.filter((w) => {
    const d = new Date(w.startTimestamp);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const fridaWeeklyWalks = currentWeekWalks.filter((w) => w.dogName === 'Frida');
  const siennaWeeklyWalks = currentWeekWalks.filter((w) => w.dogName === 'Sienna');

  const sumBy = (arr: WalkCalendarLedgerItem[], fn: (x: WalkCalendarLedgerItem) => number) =>
    arr.reduce((acc, item) => acc + fn(item), 0);

  const fridaWeekly = {
    confirmedCount: fridaWeeklyWalks.filter((w) => w.visualState === 'attended').length,
    unconfirmedCount: fridaWeeklyWalks.filter((w) => w.visualState === 'unconfirmed').length,
    declinedCount: fridaWeeklyWalks.filter((w) => w.visualState === 'declined').length,
    confirmedIncome: sumBy(fridaWeeklyWalks, (w) => w.earnedAmount),
    unconfirmedIncome: sumBy(fridaWeeklyWalks, (w) => w.pendingAmount),
    declinedLost: sumBy(fridaWeeklyWalks, (w) => w.lostAmount),
  };

  const siennaWeekly = {
    confirmedCount: siennaWeeklyWalks.filter((w) => w.visualState === 'attended').length,
    unconfirmedCount: siennaWeeklyWalks.filter((w) => w.visualState === 'unconfirmed').length,
    declinedCount: siennaWeeklyWalks.filter((w) => w.visualState === 'declined').length,
    confirmedIncome: sumBy(siennaWeeklyWalks, (w) => w.earnedAmount),
    unconfirmedIncome: sumBy(siennaWeeklyWalks, (w) => w.pendingAmount),
    declinedLost: sumBy(siennaWeeklyWalks, (w) => w.lostAmount),
  };

  const weeklyConfirmedIncome = fridaWeekly.confirmedIncome + siennaWeekly.confirmedIncome;
  const weeklyAlreadyDoneIncome = sumBy(
    currentWeekWalks.filter((w) => w.visualState === 'attended' && w.hasAlreadyPassed),
    (w) => w.earnedAmount
  );
  const weeklyUpcomingColoredIncome = weeklyConfirmedIncome - weeklyAlreadyDoneIncome;
  const weeklyUnconfirmedIncome = fridaWeekly.unconfirmedIncome + siennaWeekly.unconfirmedIncome;
  const weeklyDeclinedLostIncome = fridaWeekly.declinedLost + siennaWeekly.declinedLost;
  const weeklyMaxPotentialIncome = weeklyConfirmedIncome + weeklyUnconfirmedIncome;

  const weeklyConfirmedCount = fridaWeekly.confirmedCount + siennaWeekly.confirmedCount;
  const weeklyUnconfirmedCount = fridaWeekly.unconfirmedCount + siennaWeekly.unconfirmedCount;
  const weeklyDeclinedCount = fridaWeekly.declinedCount + siennaWeekly.declinedCount;

  const monthlyConfirmedIncome = sumBy(allMonthWalks, (w) => w.earnedAmount);
  const monthlyUnconfirmedIncome = sumBy(allMonthWalks, (w) => w.pendingAmount);
  const monthlyConfirmedCount = allMonthWalks.filter((w) => w.visualState === 'attended').length;
  const monthlyUnconfirmedCount = allMonthWalks.filter((w) => w.visualState === 'unconfirmed').length;
  const monthlyDeclinedCount = allMonthWalks.filter((w) => w.visualState === 'declined').length;

  return {
    weekRangeLabel,
    weekMondayIso,
    weekSundayIso,
    fridaRate,
    siennaRate,
    currentWeekWalks,
    nextWeekWalks,
    allMonthWalks,
    weeklyConfirmedIncome,
    weeklyAlreadyDoneIncome,
    weeklyUpcomingColoredIncome,
    weeklyUnconfirmedIncome,
    weeklyDeclinedLostIncome,
    weeklyMaxPotentialIncome,
    weeklyTotalEvents: currentWeekWalks.length,
    weeklyConfirmedCount,
    weeklyUnconfirmedCount,
    weeklyDeclinedCount,
    fridaWeekly,
    siennaWeekly,
    monthlyConfirmedIncome,
    monthlyUnconfirmedIncome,
    monthlyConfirmedCount,
    monthlyUnconfirmedCount,
    monthlyDeclinedCount,
  };
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

  const text = await res.text();
  if (!text || text.trim().startsWith('<')) {
    return [];
  }
  const data = JSON.parse(text);
  return (data.items || []) as CalendarEvent[];
}
