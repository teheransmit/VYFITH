/**
 * Tipos oficiales del Simulador UniPaseo - UPB Montería
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DogInfo {
  id: 'S' | 'F' | 'M';
  name: string;
  color: string;
  emoji: string;
  address: string;
  lat: number;
  lng: number;
  defaultWalkMinutes: number;
}

export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

export interface DayConfig {
  classTime: string;
  className: string;
  activeDogs: ('S' | 'F' | 'M')[];
}

export type StrategyType = 'zigzag' | 'lineal' | 'terminar_m';

export type TransportType = 'pie' | 'bici' | 'moto';

export type StartLocationType = 'casa' | 'centro' | 'abuela';

export interface DynamicDog {
  id: string;
  name: string;
  breed?: string;
  owner?: string;
  rate: number;
  targetMinutes: number;
  lat: number;
  lng: number;
  address: string;
  color: string;
  emoji: string;
  active: boolean;
}

export interface RouteSettings {
  day: DayOfWeek;
  startTime: string; // "06:30"
  startLocation: StartLocationType;
  firstLegTransport: TransportType;
  upbTransport?: 'bici' | 'metro';
  walkSpeedSolo: number; // km/h
  walkSpeedPack: number; // km/h
  strategy: StrategyType;
  goalSienna: number; // minutes
  goalFrida: number; // minutes
  goalMolly: number; // minutes
  pickupOrder: string[];
  scenario: 'normal' | 'lluvia' | 'trafico';
}

export interface RouteStep {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  icon: string;
  type: 'casa' | 'pick' | 'walk' | 'drop' | 'bus_wait' | 'bus_ride' | 'upb' | 'bici_ride';
  dogId?: string;
  distanceKm: number;
}

export interface TripLog {
  id: string;
  date: string;
  day: DayOfWeek;
  strategy: StrategyType;
  scheduledArrival: string;
  targetClassTime: string;
  status: 'early' | 'on_time' | 'late';
  dogsWalked: number;
  notes?: string;
}

export interface SimulationFrame {
  lat: number;
  lng: number;
  timestamp: number;
  timeStr: string;
  emoji: string;
  message: string;
  activeTimers: Record<string, number | undefined>;
  finishedDogs: string[];
}

export interface RealWalkEvent {
  timeStr: string;
  timestamp: number;
  lat: number;
  lng: number;
  type: string;
}

export interface RealWalkLog {
  id: string;
  date: string;
  startTime: number;
  endTime?: number;
  path: LatLng[];
  events: RealWalkEvent[];
  totalDistanceKm: number;
  analysis?: string;
}
