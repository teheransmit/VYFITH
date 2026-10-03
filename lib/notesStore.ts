export interface ScientificPaper {
  id: string;
  title: string;
  publicationYear: number;
  doi: string;
  authors: string;
  citedByCount: number;
  isOpenAccess: boolean;
  oaUrl: string;
  hostVenue: string;
  abstract: string;
}

export interface CuriosityNote {
  id: string;
  topic: string;
  description: string;
  dateCreated: string;
  category: 'Física & Naturaleza' | 'Ingeniería & Mecánica' | 'Biología & Vuelo' | 'Astronomía & Cosmos' | 'General';
  status: 'Investigado' | 'Pendiente';
  papers: ScientificPaper[];
}

// Nota: solo se guardan datos verificados. Título, año y DOI de estos artículos
// vienen de una búsqueda real en OpenAlex (03-oct-2026). Autores, citas y resumen
// se completan en vivo con el botón de búsqueda (endpoint /api/scientific-references).
export const initialCuriosityNotes: CuriosityNote[] = [
  {
    id: 'note-colibri',
    topic: '¿Cómo vuelan los colibríes y sostienen el vuelo estacionario?',
    description:
      'Observé cómo baten sus alas muy rápido y se quedan quietos en el aire, incluso volando hacia atrás.',
    dateCreated: '2026-10-03',
    category: 'Biología & Vuelo',
    status: 'Investigado',
    papers: [
      {
        id: 'doi-jeb.161828',
        title: 'Individual variation and the biomechanics of maneuvering flight in hummingbirds',
        publicationYear: 2020,
        doi: 'https://doi.org/10.1242/jeb.161828',
        authors: 'Ver autores en el DOI',
        citedByCount: 0,
        isOpenAccess: false,
        oaUrl: 'https://doi.org/10.1242/jeb.161828',
        hostVenue: 'Journal of Experimental Biology',
        abstract: 'Abre el DOI para leer el resumen original.',
      },
      {
        id: 'doi-jeb.005686',
        title: 'Three-dimensional kinematics of hummingbird flight',
        publicationYear: 2007,
        doi: 'https://doi.org/10.1242/jeb.005686',
        authors: 'Ver autores en el DOI',
        citedByCount: 0,
        isOpenAccess: false,
        oaUrl: 'https://doi.org/10.1242/jeb.005686',
        hostVenue: 'Journal of Experimental Biology',
        abstract: 'Abre el DOI para leer el resumen original.',
      },
    ],
  },
  {
    id: 'note-sinu-meandros',
    topic: 'Dinámica de meandros y sedimentación en el Río Sinú (Montería)',
    description:
      'Erosión en la orilla exterior de las curvas y depósito en la interior durante la temporada de lluvias en Córdoba.',
    dateCreated: '2026-09-28',
    category: 'Ingeniería & Mecánica',
    status: 'Pendiente',
    papers: [],
  },
];
