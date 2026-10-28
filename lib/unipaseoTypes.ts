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

export type TransportType = 'pie' | 'moto';

export interface RouteSettings {
  day: DayOfWeek;
  startTime: string; // "06:30"
  startLocation: 'centro' | 'abuela';
  firstLegTransport: TransportType;
  walkSpeedSolo: number; // km/h
  walkSpeedPack: number; // km/h
  strategy: StrategyType;
  goalSienna: number; // minutes
  goalFrida: number; // minutes
  goalMolly: number; // minutes
  pickupOrder: ('S' | 'F' | 'M')[];
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
  type: 'casa' | 'pick' | 'walk' | 'drop' | 'bus_wait' | 'bus_ride' | 'upb';
  dogId?: 'S' | 'F' | 'M';
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
  activeTimers: {
    S?: number;
    F?: number;
    M?: number;
  };
  finishedDogs: ('S' | 'F' | 'M')[];
}

export interface RealWalkEvent {
  timeStr: string;
  timestamp: number;
  lat: number;
  lng: number;
  type: 'start' | 'pick_S' | 'pick_F' | 'pick_M' | 'end';
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
