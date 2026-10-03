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

export const initialCuriosityNotes: CuriosityNote[] = [
  {
    id: 'note-colibri',
    topic: '¿Cómo vuelan los colibríes y sostienen el vuelo estacionario?',
    description:
      'Observé cómo baten sus alas en forma de ocho (∞) con una frecuencia extrema sin fatigarse y con un consumo de oxígeno altísimo.',
    dateCreated: '2026-10-03',
    category: 'Biología & Vuelo',
    status: 'Investigado',
    papers: [
      {
        id: 'W2963842103',
        title: 'Individual variation and the biomechanics of maneuvering flight in hummingbirds',
        publicationYear: 2020,
        doi: 'https://doi.org/10.1242/jeb.161828',
        authors: 'Roslyn Dakin, Paolo Segre, Douglas L. Altshuler',
        citedByCount: 42,
        isOpenAccess: true,
        oaUrl: 'https://doi.org/10.1242/jeb.161828',
        hostVenue: 'Journal of Experimental Biology',
        abstract:
          'Los colibríes utilizan cinemática alar no estacionaria produciendo sustentación tanto en el batido hacia adelante como hacia atrás, invirtiendo la superficie alar en 180 grados a frecuencias de hasta 80 Hz.',
      },
      {
        id: 'W2053891456',
        title: 'Three-dimensional kinematics of hummingbird flight',
        publicationYear: 2007,
        doi: 'https://doi.org/10.1242/jeb.005686',
        authors: 'Bret W. Tobalske, Douglas L. Altshuler',
        citedByCount: 185,
        isOpenAccess: true,
        oaUrl: 'https://doi.org/10.1242/jeb.005686',
        hostVenue: 'Journal of Experimental Biology',
        abstract:
          'Análisis tridimensional de vórtices y generación de sustentación mediante cámaras de alta velocidad en túnel de viento.',
      },
    ],
  },
  {
    id: 'note-sinu-meandros',
    topic: 'Dinámica de meandros y sedimentación en el Río Sinú (Montería)',
    description:
      'Comportamiento hidrográfico del río Sinú, procesos de erosión en la margen cóncava y depósito en la convexa durante épocas de lluvia en Córdoba.',
    dateCreated: '2026-09-28',
    category: 'Ingeniería & Mecánica',
    status: 'Investigado',
    papers: [
      {
        id: 'W2183921004',
        title: 'Morphodynamics and sediment transport of tropical meandering rivers',
        publicationYear: 2021,
        doi: 'https://doi.org/10.1016/j.geomorph.2021.107842',
        authors: 'Carlos E. Restrepo, Maria J. Gomez',
        citedByCount: 29,
        isOpenAccess: true,
        oaUrl: 'https://doi.org/10.1016/j.geomorph.2021.107842',
        hostVenue: 'Geomorphology',
        abstract:
          'Evaluación de esfuerzos cortantes de fondo y evolución de curvas de meandros en llanuras aluviales tropicales.',
      },
    ],
  },
];
