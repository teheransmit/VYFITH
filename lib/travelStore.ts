export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  category?: 'equipaje' | 'compras' | 'documentos' | 'movilidad';
}

export interface TravelExpense {
  id: string;
  concept: string;
  amount: number;
  paymentMethod: 'Efectivo' | 'Nu' | 'Nequi';
  category: 'Transporte' | 'Alimentación' | 'Compras' | 'Salidas' | 'Imprevistos';
  timestamp: string;
}

export interface TravelMusicTrack {
  id: string;
  title: string;
  artist: string;
  url?: string;
  addedAt: string;
}

export interface TravelState {
  cashInHand: number;
  nuSavings: number;
  nequiSavings: number;
  pendingFamilyContributions: number;
  expenses: TravelExpense[];
  checklist: ChecklistItem[];
  playlist: TravelMusicTrack[];
  notes: string;
  lastSynced: string;
}

export const initialTravelChecklist: ChecklistItem[] = [
  { id: 'c1', label: 'Cédula de ciudadanía física original (indispensable para abordar y sacar la Cívica)', done: true, category: 'documentos' },
  { id: 'c2', label: 'Pasabordo JetSMART con código QR guardado en fotos del celular (JA5483)', done: true, category: 'documentos' },
  { id: 'c3', label: 'Mochila Temu con correas de compresión tensadas (≤ 45x35x25 cm, ≤ 10 kg)', done: true, category: 'equipaje' },
  { id: 'c4', label: 'Compras D1/Ara: Desodorante Roll-on XEN (75 ml), talco para pies pequeño y chicles para oídos', done: false, category: 'compras' },
  { id: 'c5', label: 'Líquidos ≤100 ml en Ziploc: Champú Medicasp (100 ml), Perfume Eros (30-50 ml), crema capilar reenvasada', done: false, category: 'equipaje' },
  { id: 'c6', label: 'Afeitadora Prestobarba desechable y pastillas en su blíster empacadas en cabina', done: false, category: 'equipaje' },
  { id: 'c7', label: 'Power Bank LinkOn 20.000 mAh (74 Wh ≤ 100 Wh ✅) y portátil en la mochila de mano', done: false, category: 'equipaje' },
  { id: 'c8', label: 'Llegada a Los Garzones a las 10:48 AM (subir directo al 2.° piso a control de seguridad)', done: false, category: 'movilidad' },
  { id: 'c9', label: 'Tomar bus blanco en Rionegro hacia San Diego ($15.000 COP) y taxi por Calle 33 a La Castellana', done: false, category: 'movilidad' },
  { id: 'c10', label: 'Efectivo fraccionado a mano: billetes de $10k/$20k para bus y taxi', done: false, category: 'compras' },
  { id: 'c11', label: 'Chaqueta / buzo ligero a mano para el frío de Rionegro (16°C) al descender del avión', done: false, category: 'equipaje' },
  { id: 'c12', label: 'Captura offline guardada: Código de acceso y WhatsApp del anfitrión en La Castellana', done: true, category: 'documentos' },
  { id: 'c13', label: 'Termo de café de aluminio empacado 100% VACÍO (se llena gratis en sala de abordaje; agua EPM en Medellín)', done: false, category: 'equipaje' },
];

export const initialTravelPlaylist: TravelMusicTrack[] = [
  { id: 'm1', title: 'Feather', artist: 'Nujabes', addedAt: '2026-10-07' },
  { id: 'm2', title: 'Aruarian Dance', artist: 'Nujabes', addedAt: '2026-10-07' },
  { id: 'm3', title: 'Starboy', artist: 'The Weeknd', addedAt: '2026-10-07' },
  { id: 'm4', title: 'Blinding Lights', artist: 'The Weeknd', addedAt: '2026-10-07' },
  { id: 'm5', title: 'Lofi Flight Chill (Medellín Vibes)', artist: 'Curaduría Personal', addedAt: '2026-10-07' },
];

export const initialTravelState: TravelState = {
  cashInHand: 172000, // $202.000 inicial - $12.000 barbería - $18.000 compras D1/Ara
  nuSavings: 148579,
  nequiSavings: 0,
  pendingFamilyContributions: 150000,
  expenses: [
    {
      id: 'e-init-1',
      concept: 'Motilada previa en barbería',
      amount: 12000,
      paymentMethod: 'Efectivo',
      category: 'Compras',
      timestamp: '2026-10-07T14:00:00Z',
    },
    {
      id: 'e-init-2',
      concept: 'Compras D1/Ara (Roll-on XEN, talco pies, chicles oídos, snack)',
      amount: 18000,
      paymentMethod: 'Efectivo',
      category: 'Compras',
      timestamp: '2026-10-07T16:00:00Z',
    },
  ],
  checklist: initialTravelChecklist,
  playlist: initialTravelPlaylist,
  notes: `🏨 Airbnb: Calle 35, La Castellana (6.242847, -75.601348)
🔑 Check-in flexible desde las 3:00 PM.
🚖 Taxi desde San Diego: Pedir Calle 33 hasta La Castellana (~$12k-$14k COP).
🚇 PAC Metro San Antonio: Reclamar Tarjeta Cívica con cédula física (antes de 6:45 PM).
💧 Termo de aluminio: Pasarlo 100% VACÍO por Rayos X; llenar gratis en sala de abordaje.`,
  lastSynced: new Date().toISOString(),
};

const STORAGE_KEY = 'vyfith_travel_state_v1';

export function loadTravelState(): TravelState {
  if (typeof window === 'undefined') {
    return initialTravelState;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTravelState));
      return initialTravelState;
    }
    const parsed = JSON.parse(raw);
    return {
      ...initialTravelState,
      ...parsed,
      checklist: parsed.checklist && parsed.checklist.length > 0 ? parsed.checklist : initialTravelState.checklist,
      playlist: parsed.playlist && parsed.playlist.length > 0 ? parsed.playlist : initialTravelState.playlist,
    };
  } catch (err) {
    console.error('Error cargando estado de viaje desde localStorage:', err);
    return initialTravelState;
  }
}

export function saveTravelState(state: TravelState): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = {
      ...state,
      lastSynced: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error guardando estado de viaje en localStorage:', err);
  }
}
