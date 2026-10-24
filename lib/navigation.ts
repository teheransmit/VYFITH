export type DashboardTab =
  | 'overview'
  | 'bio'
  | 'health'
  | 'horario'
  | 'grades'
  | 'walks'
  | 'finance';

export interface DashboardNavItem {
  id: DashboardTab;
  label: string;
  shortLabel: string;
  commandTitle: string;
  commandSubtitle: string;
  badge: string;
  color: 'slate' | 'indigo' | 'rose' | 'blue' | 'amber' | 'emerald';
  icon: 'sparkles' | 'user' | 'activity' | 'calendar' | 'graduation' | 'footprints' | 'credit-card';
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'overview',
    label: 'Inicio',
    shortLabel: 'Inicio',
    commandTitle: 'Vista General del Sistema',
    commandSubtitle: 'Resumen ejecutivo de métricas cruzadas y prioridades de hoy',
    badge: 'Pilar 1',
    color: 'slate',
    icon: 'sparkles',
  },
  {
    id: 'bio',
    label: 'Perfil',
    shortLabel: 'Perfil',
    commandTitle: 'Bio & Portafolio IA',
    commandSubtitle: 'Perfil híbrido, proyectos y visión profesional',
    badge: 'Pilar 2',
    color: 'indigo',
    icon: 'user',
  },
  {
    id: 'health',
    label: 'Salud',
    shortLabel: 'Salud',
    commandTitle: 'Salud, Biometría & Fitness',
    commandSubtitle: 'Readiness, Gimnasio UPB y sobrecarga Hevy',
    badge: 'Pilar 3',
    color: 'rose',
    icon: 'activity',
  },
  {
    id: 'horario',
    label: 'Agenda',
    shortLabel: 'Agenda',
    commandTitle: 'Agenda & Horario UPB',
    commandSubtitle: 'Clases semanales y Google Calendar en vivo',
    badge: 'Pilar 4',
    color: 'blue',
    icon: 'calendar',
  },
  {
    id: 'grades',
    label: 'Estudio',
    shortLabel: 'Estudio',
    commandTitle: 'Academia & Literatura UPB',
    commandSubtitle: 'Calificaciones SIGAA y literatura científica',
    badge: 'Pilar 5',
    color: 'amber',
    icon: 'graduation',
  },
  {
    id: 'walks',
    label: 'Paseos',
    shortLabel: 'Paseos',
    commandTitle: 'Paseos Caninos & Rutina UPB',
    commandSubtitle: 'Salidas con Frida y confort térmico en Montería',
    badge: 'Pilar 6',
    color: 'amber',
    icon: 'footprints',
  },
  {
    id: 'finance',
    label: 'Dinero',
    shortLabel: 'Dinero',
    commandTitle: 'Finanzas Personales & iPhone',
    commandSubtitle: 'Ahorro Nu, presupuesto y obligaciones pendientes',
    badge: 'Pilar 7',
    color: 'emerald',
    icon: 'credit-card',
  },
];
