'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * UniPaseo - Simulador Oficial de Paseos y Rutinas UPB Montería
 * Creado e iterado por Santiago Smit Teherán Mogollón en Google AI Studio
 * Integrado integralmente en el MegaProyecto VYFITH
 */

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  LatLng,
  RouteSettings,
  RouteStep,
  TripLog,
  SimulationFrame,
  DayOfWeek,
  StrategyType,
  RealWalkLog,
} from '@/lib/unipaseoTypes';
import { fetchRoute } from '@/lib/unipaseoRouting';
import Timeline from '@/components/unipaseo/Timeline';
import ConfigPanel from '@/components/unipaseo/ConfigPanel';
import HistoryLog from '@/components/unipaseo/HistoryLog';
import DogManagerModal from '@/components/unipaseo/DogManagerModal';
import MovisinuTransitViewer from '@/components/unipaseo/MovisinuTransitViewer';
import { DynamicDog } from '@/lib/unipaseoTypes';

import {
  Play,
  Pause,
  TrendingUp,
  Clock,
  Info,
  Maximize2,
  Minimize2,
  Calendar,
  Compass,
  Sparkles,
  Bike,
  Dog,
  Bus,
} from 'lucide-react';

// Carga asíncrona de mapas Leaflet (Next.js SSR safe)
const MapContainer = dynamic(() => import('@/components/unipaseo/MapContainer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-400">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-bold text-slate-500">Cargando mapa cartográfico de Montería...</span>
    </div>
  ),
});

const RealWalk = dynamic(() => import('@/components/unipaseo/RealWalk'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-400">
      <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-3" />
      <span className="text-xs font-bold text-slate-500">Iniciando sensor GPS...</span>
    </div>
  ),
});

// Coordenadas físicas oficiales en Montería, Colombia
const BASE_LOCATIONS = {
  casa: { lat: 8.753656905902142, lng: -75.87434089839805, name: 'Mi Casa', emoji: '🏡' },
  centro: { lat: 8.76132, lng: -75.87928, name: 'Casa Centro', emoji: '🏢' },
  abuela: { lat: 8.753656905902142, lng: -75.87434089839805, name: 'Casa Abuela', emoji: '👵' },
  S: { lat: 8.77228, lng: -75.85933, name: 'Sienna', color: '#f97316', emoji: '🍊', address: 'Edificio Palmanova' },
  F: { lat: 8.77418, lng: -75.86532, name: 'Frida', color: '#8b5cf6', emoji: '🍇', address: 'Castellana 101' },
  M: { lat: 8.76630, lng: -75.86490, name: 'Molly', color: '#eab308', emoji: '🍌', address: 'La Castellana' },
  cra14: { lat: 8.77189, lng: -75.86720 }, // Paradero de buseta (Carrera 14)
  upb: { lat: 8.80457, lng: -75.85040 }, // Campus UPB Montería (Km 8 Vía Cereté)
};

const DEFAULT_CUSTOM_DOGS: DynamicDog[] = [
  {
    id: 'S',
    name: 'Sienna',
    breed: 'Raza grande activa',
    owner: 'Elena',
    rate: 9000,
    targetMinutes: 30,
    lat: 8.77228,
    lng: -75.85933,
    address: 'Edificio Palmanova',
    color: '#f97316',
    emoji: '🍊',
    active: true,
  },
  {
    id: 'F',
    name: 'Frida',
    breed: 'Criolla enérgica',
    owner: 'Laura',
    rate: 5000,
    targetMinutes: 10,
    lat: 8.77418,
    lng: -75.86532,
    address: 'Castellana 101',
    color: '#8b5cf6',
    emoji: '🍇',
    active: true,
  },
];

// Horarios oficiales de asignaturas UPB por día
const CLASS_SCHEDULES: { [key in DayOfWeek]: { time: string; name: string } } = {
  lunes: { time: '10:00', name: 'Vías II (Diseño Pavimentos)' },
  martes: { time: '08:00', name: 'Análisis de Estructuras II' },
  miercoles: { time: '10:00', name: 'Vías II (Laboratorio)' },
  jueves: { time: '08:00', name: 'Análisis de Estructuras II' },
  viernes: { time: '10:00', name: 'Vías II (Teoría avanzada)' },
};

export default function UpbWalkSimulatorSection() {
  const [locations, setLocations] = useState(() => {
    if (typeof window === 'undefined') return BASE_LOCATIONS;
    const saved = localStorage.getItem('upb_sim_locations');
    if (!saved) return BASE_LOCATIONS;
    try {
      const parsed = JSON.parse(saved);
      return { ...BASE_LOCATIONS, ...parsed, casa: parsed.casa || BASE_LOCATIONS.casa };
    } catch {
      return BASE_LOCATIONS;
    }
  });

  const [settings, setSettings] = useState<RouteSettings>(() => {
    const defaultSettings: RouteSettings = {
      day: 'martes',
      startTime: '06:00',
      startLocation: 'casa',
      firstLegTransport: 'bici',
      walkSpeedSolo: 5.5,
      walkSpeedPack: 4.26,
      strategy: 'zigzag',
      goalSienna: 30,
      goalFrida: 10,
      goalMolly: 0,
      pickupOrder: ['S', 'F'],
      scenario: 'normal',
    };
    if (typeof window === 'undefined') return defaultSettings;
    const saved = localStorage.getItem('upb_sim_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const sanitizedOrder = (parsed.pickupOrder || ['S', 'F']).filter((id: string) => id !== 'M');
        return {
          ...defaultSettings,
          ...parsed,
          goalMolly: 0,
          pickupOrder: sanitizedOrder.length > 0 ? sanitizedOrder : ['S', 'F'],
        };
      } catch {}
    }
    return defaultSettings;
  });

  const [logs, setLogs] = useState<TripLog[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('upb_sim_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [realLogs, setRealLogs] = useState<RealWalkLog[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('upb_real_walk_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState<'timeline' | 'config' | 'logs' | 'realwalk' | 'movisinu'>('timeline');
  const [isDogManagerOpen, setIsDogManagerOpen] = useState(false);
  const [customDogs, setCustomDogs] = useState<DynamicDog[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_CUSTOM_DOGS;
    const saved = localStorage.getItem('upb_sim_dogs_v2');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return DEFAULT_CUSTOM_DOGS;
  });
  const [isComputing, setIsComputing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Coordenadas calculadas y distancias
  const [routePaths, setRoutePaths] = useState<{ [key: string]: LatLng[] }>({});
  const [routeDistances, setRouteDistances] = useState<{ [key: string]: number }>({});

  // Simulación en tiempo real
  const [simulationPlaying, setSimulationPlaying] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const isThreeDogs = false;

  // Persistencia en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('upb_sim_locations', JSON.stringify(locations));
    }
  }, [locations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('upb_sim_settings', JSON.stringify(settings));
    }
  }, [settings]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('upb_sim_logs', JSON.stringify(logs));
    }
  }, [logs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('upb_real_walk_logs', JSON.stringify(realLogs));
    }
  }, [realLogs]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('upb_sim_dogs_v2', JSON.stringify(customDogs));
    }
  }, [customDogs]);

  const handleSaveCustomDogs = (updated: DynamicDog[]) => {
    setCustomDogs(updated);
    setLocations((prev: any) => {
      const next = { ...prev };
      updated.forEach((d) => {
        next[d.id] = {
          lat: d.lat,
          lng: d.lng,
          name: d.name,
          color: d.color,
          emoji: d.emoji,
          address: d.address,
        };
      });
      return next;
    });
    const sienna = updated.find((d) => d.id === 'S' || d.name.toLowerCase().includes('sienna'));
    const frida = updated.find((d) => d.id === 'F' || d.name.toLowerCase().includes('frida'));
    setSettings((prev) => ({
      ...prev,
      goalSienna: sienna ? sienna.targetMinutes : prev.goalSienna,
      goalFrida: frida ? frida.targetMinutes : prev.goalFrida,
    }));
  };

  // Manejo de drag & drop de pines en el mapa
  const handleLocationDrag = (key: string, newLatLng: LatLng) => {
    setLocations((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        lat: newLatLng.lat,
        lng: newLatLng.lng,
      },
    }));
  };

  const handleResetLocations = () => {
    if (window.confirm('¿Quieres restablecer las ubicaciones originales de Montería?')) {
      setLocations(BASE_LOCATIONS);
    }
  };

  // Cálculo de rutas en segundo plano con OSRM y fallback Manhattan
  useEffect(() => {
    let active = true;
    const loadRoutes = async () => {
      setIsComputing(true);
      const startLoc = locations[settings.startLocation] || locations.casa || locations.abuela;
      const order = settings.pickupOrder;

      const speedSoloMod = settings.scenario === 'lluvia' ? settings.walkSpeedSolo * 0.8 : settings.walkSpeedSolo;
      const speedPackMod = settings.scenario === 'lluvia' ? settings.walkSpeedPack * 0.8 : settings.walkSpeedPack;

      const pFirstLegMode = settings.firstLegTransport === 'moto' ? 'driving' : 'walking';
      const pFirstLegSpeed = settings.firstLegTransport === 'moto' ? 32 : (settings.firstLegTransport === 'bici' ? 15 : speedSoloMod);

      const p1 = locations[order[0]];
      const p2 = locations[order[1]];
      const p3 = locations[order[2]] || locations[order[1]] || locations.S;
      const bus = locations.cra14;
      const upb = locations.upb;

      try {
        const results: { [key: string]: { coordinates: LatLng[]; distanceKm: number } } = {};

        const promises = [
          fetchRoute(startLoc, p1, pFirstLegMode, pFirstLegSpeed).then((r) => { results['C_P1'] = r; }),
          fetchRoute(p1, p2, 'walking', speedPackMod).then((r) => { results['P1_P2'] = r; }),
          fetchRoute(p2, p3, 'walking', speedPackMod).then((r) => { results['P2_P3'] = r; }),
          fetchRoute(p3, p1, 'walking', speedPackMod).then((r) => { results['P3_P1'] = r; }),
          fetchRoute(p1, bus, 'walking', speedSoloMod).then((r) => { results['P1_Bus'] = r; }),
          fetchRoute(p3, bus, 'walking', speedSoloMod).then((r) => { results['P3_Bus'] = r; }),
          fetchRoute(bus, upb, 'driving', 20).then((r) => { results['Bus_UPB'] = r; }),
        ];

        await Promise.all(promises);

        if (active) {
          setRoutePaths(Object.keys(results).reduce((acc, k) => ({ ...acc, [k]: results[k].coordinates }), {}));
          setRouteDistances(Object.keys(results).reduce((acc, k) => ({ ...acc, [k]: results[k].distanceKm }), {}));
        }
      } catch (err) {
        console.error('Error calculando rutas:', err);
      } finally {
        if (active) setIsComputing(false);
      }
    };

    loadRoutes();

    return () => {
      active = false;
    };
  }, [locations, settings.startLocation, settings.pickupOrder, settings.firstLegTransport, settings.scenario]);

  const targetClassInfo = useMemo(() => {
    return CLASS_SCHEDULES[settings.day];
  }, [settings.day]);

  // Algoritmo de secuenciación cronológica y backtracking de horas
  const sequenceData = useMemo(() => {
    if (Object.keys(routeDistances).length === 0) {
      return { steps: [], finalArrival: '00:00', dogWalkDurations: { S: 0, F: 0, M: 0 } };
    }

    const order = (settings.pickupOrder || ['S', 'F']).filter((id) => id !== 'M');
    const p1Dog = order[0] || 'S';
    const p2Dog = order[1] || 'F';
    const goals: Record<string, number> = { S: settings.goalSienna, F: settings.goalFrida };

    const speedSoloMod = settings.scenario === 'lluvia' ? settings.walkSpeedSolo * 0.8 : settings.walkSpeedSolo;
    const speedPackMod = settings.scenario === 'lluvia' ? settings.walkSpeedPack * 0.8 : settings.walkSpeedPack;

    const [startH, startM] = settings.startTime.split(':').map(Number);
    let curDate = new Date(2024, 0, 1, startH, startM, 0, 0);

    // Backtrack: Partida desde casa hasta el primer perro
    const startLocToP1Dist = routeDistances['C_P1'] || 0.5;
    const departureSpeed = settings.firstLegTransport === 'moto' ? 32 : (settings.firstLegTransport === 'bici' ? 15 : speedSoloMod);
    const departureMinutes = Math.round((startLocToP1Dist / departureSpeed) * 60);
    const departureTimeDate = new Date(curDate.getTime() - departureMinutes * 60000);
    const departureTimeStr = departureTimeDate.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const steps: RouteStep[] = [];
    const dogWalkDurations: Record<string, number> = { S: 0, F: 0, M: 0 };

    // Paso 1: Salida en Bici desde Mi Casa
    steps.push({
      id: 'step_departure',
      title: `Partida de Casa (${settings.startLocation === 'casa' ? 'Mi Casa' : settings.startLocation === 'centro' ? 'Centro' : 'Abuela'})`,
      description: `Inicias traslado hacia la casa de ${p1Dog === 'S' ? 'Sienna' : 'Frida'}.\nModo: ${settings.firstLegTransport === 'bici' ? '🚲 Bicicleta (~15 km/h)' : settings.firstLegTransport === 'moto' ? '🏍️ Moto' : '🚶‍♂️ A Pie'}. Distancia: ${startLocToP1Dist.toFixed(2)} km.`,
      startTime: departureTimeStr,
      endTime: settings.startTime,
      durationMinutes: departureMinutes,
      icon: 'casa',
      type: 'casa',
      distanceKm: startLocToP1Dist,
    });

    let curTimeStr = settings.startTime;

    // Paso 2: Recogida de Sienna
    steps.push({
      id: `pick_${p1Dog}`,
      title: `Recoger a ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Buscas a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} en ${p1Dog === 'S' ? 'Ed. Palmanova' : 'Castellana 101'}.\nInicia su paseo objetivo de ${goals[p1Dog]} min.`,
      startTime: curTimeStr,
      endTime: curTimeStr,
      durationMinutes: 0,
      icon: 'pick',
      type: 'pick',
      dogId: p1Dog,
      distanceKm: 0,
    });

    // Paso 3: Tránsito con Sienna
    const p1ToP2Dist = routeDistances['P1_P2'] || 0.4;
    const p1ToP2Mins = Math.max(1, Math.round((p1ToP2Dist / speedPackMod) * 60));
    let nextDate = new Date(curDate.getTime() + p1ToP2Mins * 60000);
    let nextTimeStr = nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    dogWalkDurations[p1Dog] += p1ToP2Mins;

    steps.push({
      id: 'transit_p1_p2',
      title: `Tránsito con ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Recorres con la manada hasta donde ${p2Dog === 'S' ? 'Sienna' : 'Frida'}. Distancia: ${p1ToP2Dist.toFixed(2)} km.`,
      startTime: curTimeStr,
      endTime: nextTimeStr,
      durationMinutes: p1ToP2Mins,
      icon: 'walk',
      type: 'walk',
      distanceKm: p1ToP2Dist,
    });
    curDate = nextDate;
    curTimeStr = nextTimeStr;

    // Paso 4: Recogida de Frida
    steps.push({
      id: `pick_${p2Dog}`,
      title: `Recoger a ${p2Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Sumas a la manada a ${p2Dog === 'S' ? 'Sienna' : 'Frida'} en ${p2Dog === 'S' ? 'Ed. Palmanova' : 'Castellana 101'}.\nInicia su tiempo objetivo de ${goals[p2Dog]} min.`,
      startTime: curTimeStr,
      endTime: curTimeStr,
      durationMinutes: 0,
      icon: 'pick',
      type: 'pick',
      dogId: p2Dog,
      distanceKm: 0,
    });

    // Paso 5: Paseo conjunto / camino a devolver a Frida (completa 10 min de meta)
    const p2WalkMins = goals[p2Dog] || 10;
    const dTransitP2 = routeDistances['P1_P2'] || 0.4;
    nextDate = new Date(curDate.getTime() + p2WalkMins * 60000);
    nextTimeStr = nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    dogWalkDurations[p1Dog] += p2WalkMins;
    dogWalkDurations[p2Dog] += p2WalkMins;

    steps.push({
      id: 'drop_p2_trip',
      title: `Paseo conjunto / camino a devolver a ${p2Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Caminas junto a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} y ${p2Dog === 'S' ? 'Sienna' : 'Frida'} completando el recorrido de ${p2Dog === 'S' ? 'Sienna' : 'Frida'}. Distancia: ${dTransitP2.toFixed(2)} km.`,
      startTime: curTimeStr,
      endTime: nextTimeStr,
      durationMinutes: p2WalkMins,
      icon: 'walk',
      type: 'walk',
      distanceKm: dTransitP2,
    });
    curDate = nextDate;
    curTimeStr = nextTimeStr;

    // Paso 6: Devolución de Frida (completa 10m)
    steps.push({
      id: `drop_${p2Dog}`,
      title: `Devolver a ${p2Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Entregas a ${p2Dog === 'S' ? 'Sienna' : 'Frida'} en ${p2Dog === 'S' ? 'Ed. Palmanova' : 'Castellana 101'}. Paseo completado (${dogWalkDurations[p2Dog]}m cumplidos).`,
      startTime: curTimeStr,
      endTime: curTimeStr,
      durationMinutes: 0,
      icon: 'drop',
      type: 'drop',
      dogId: p2Dog,
      distanceKm: 0,
    });

    // Paso 7: Camino a devolver a Sienna (completa 30m: 9m iniciales + 10m conjunto + 11m retorno)
    const p1RemainingMins = Math.max(1, (goals[p1Dog] || 30) - dogWalkDurations[p1Dog]);
    const dTransitP1 = routeDistances['P1_P2'] || 0.4;
    nextDate = new Date(curDate.getTime() + p1RemainingMins * 60000);
    nextTimeStr = nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    dogWalkDurations[p1Dog] += p1RemainingMins;

    steps.push({
      id: 'drop_p1_trip',
      title: `Camino a devolver a ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Regresas para entregar a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} en su hogar. Distancia: ${dTransitP1.toFixed(2)} km.`,
      startTime: curTimeStr,
      endTime: nextTimeStr,
      durationMinutes: p1RemainingMins,
      icon: 'walk',
      type: 'walk',
      distanceKm: dTransitP1,
    });
    curDate = nextDate;
    curTimeStr = nextTimeStr;

    // Paso 8: Devolución de Sienna (completa 30m)
    steps.push({
      id: `drop_${p1Dog}`,
      title: `Devolver a ${p1Dog === 'S' ? 'Sienna' : 'Frida'}`,
      description: `Entregas a ${p1Dog === 'S' ? 'Sienna' : 'Frida'} sano y salvo. Paseo completado (${dogWalkDurations[p1Dog]}m cumplidos).`,
      startTime: curTimeStr,
      endTime: curTimeStr,
      durationMinutes: 0,
      icon: 'drop',
      type: 'drop',
      dogId: p1Dog,
      distanceKm: 0,
    });

    // Paso 9: Traslado rápido al paradero Cra 14
    const dBusWalk = routeDistances['P1_Bus'] || 0.5;
    const mBusWalk = Math.max(1, Math.round((dBusWalk / speedSoloMod) * 60));
    nextDate = new Date(curDate.getTime() + mBusWalk * 60000);
    nextTimeStr = nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    steps.push({
      id: 'walk_to_bus',
      title: 'Traslado rápido al paradero Cra 14',
      description: `Te diriges hacia el paradero de la Carrera 14. Distancia: ${dBusWalk.toFixed(2)} km a paso veloz (${speedSoloMod} km/h).`,
      startTime: curTimeStr,
      endTime: nextTimeStr,
      durationMinutes: mBusWalk,
      icon: 'walk',
      type: 'walk',
      distanceKm: dBusWalk,
    });
    curDate = nextDate;
    curTimeStr = nextTimeStr;

    // Paso 10: Espera en el paradero Cra 14
    const waitMins = 5;
    nextDate = new Date(curDate.getTime() + waitMins * 60000);
    nextTimeStr = nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    steps.push({
      id: 'wait_for_bus',
      title: 'Espera en el paradero Cra 14',
      description: 'Buffer de espera estimado de 5 minutos para el colectivo de transporte o buseta.',
      startTime: curTimeStr,
      endTime: nextTimeStr,
      durationMinutes: waitMins,
      icon: 'bus_wait',
      type: 'bus_wait',
      distanceKm: 0,
    });
    curDate = nextDate;
    curTimeStr = nextTimeStr;

    // Paso 11: Colectivo / MetroSinú a UPB
    const busDist = routeDistances['Bus_UPB'] || 4.2;
    let busMins = Math.round((busDist / 20) * 60);
    if (settings.scenario === 'trafico') {
      busMins += 12;
    }

    nextDate = new Date(curDate.getTime() + busMins * 60000);
    nextTimeStr = nextDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });

    steps.push({
      id: 'transit_to_upb',
      title: 'Colectivo / MetroSinú a UPB',
      description: `Buses de Montería (MetroSinú) rumbo norte hasta campus UPB. Distancia: ${busDist.toFixed(2)} km.${settings.scenario === 'trafico' ? ' 🚗 Tráfico pesado (+12m).' : ''}`,
      startTime: curTimeStr,
      endTime: nextTimeStr,
      durationMinutes: busMins,
      icon: 'bus_ride',
      type: 'bus_ride',
      distanceKm: busDist,
    });
    curDate = nextDate;
    curTimeStr = nextTimeStr;

    // Paso 12: Llegada Campus UPB Montería 🎓
    steps.push({
      id: 'step_upb_arrival',
      title: 'Llegada Campus UPB Montería 🎓',
      description: `Arribas formalmente al acceso peatonal UPB. Tu clase inicia a las ${targetClassInfo.time}.`,
      startTime: curTimeStr,
      endTime: curTimeStr,
      durationMinutes: 0,
      icon: 'upb',
      type: 'upb',
      distanceKm: 0,
    });

    return {
      steps,
      finalArrival: curTimeStr,
      dogWalkDurations,
    };
  }, [routeDistances, settings, targetClassInfo]);

  // Generador de trayectoria continua para simulación animada
  const rawTrajectory = useMemo(() => {
    if (sequenceData.steps.length === 0 || Object.keys(routePaths).length === 0) return [];

    const trajectoryPoints: {
      lat: number;
      lng: number;
      stepId: string;
      type: string;
      info: string;
      dogId?: string;
    }[] = [];

    sequenceData.steps.forEach((step) => {
      let segmentKey = '';
      let isReverseInput = false;

      if (step.id === 'step_departure') segmentKey = 'C_P1';
      else if (step.id === 'transit_p1_p2') segmentKey = 'P1_P2';
      else if (step.id === 'drop_p2_trip') segmentKey = 'P1_P2';
      else if (step.id === 'drop_p1_trip') {
        segmentKey = 'P1_P2';
        isReverseInput = true;
      } else if (step.id === 'walk_to_bus') segmentKey = 'P1_Bus';
      else if (step.id === 'transit_to_upb') segmentKey = 'Bus_UPB';

      const pts = segmentKey ? routePaths[segmentKey] : [];
      if (pts && pts.length > 0) {
        const pArray = isReverseInput ? [...pts].reverse() : [...pts];
        const maxPoints = 25;
        const stepSize = Math.max(1, Math.ceil(pArray.length / maxPoints));
        const sampled: LatLng[] = [];
        for (let i = 0; i < pArray.length; i += stepSize) {
          sampled.push(pArray[i]);
        }
        if (sampled[sampled.length - 1] !== pArray[pArray.length - 1]) {
          sampled.push(pArray[pArray.length - 1]);
        }

        sampled.forEach((p) => {
          trajectoryPoints.push({
            lat: p.lat,
            lng: p.lng,
            stepId: step.id,
            type: step.type,
            info: step.title,
            dogId: step.dogId,
          });
        });
      } else {
        const targetLatLng = step.dogId ? (locations as any)[step.dogId] : locations.upb;
        if (targetLatLng) {
          trajectoryPoints.push({
            lat: targetLatLng.lat,
            lng: targetLatLng.lng,
            stepId: step.id,
            type: step.type,
            info: step.title,
            dogId: step.dogId,
          });
        }
      }
    });

    return trajectoryPoints;
  }, [sequenceData.steps, routePaths, locations, settings.strategy]);

  // Interpolación de cuadros de animación en el tiempo
  const simulationFrames = useMemo<SimulationFrame[]>(() => {
    if (rawTrajectory.length === 0 || sequenceData.steps.length === 0) return [];

    const [startH, startM] = settings.startTime.split(':').map(Number);
    const curDate = new Date(2024, 0, 1, startH, startM, 0, 0);

    const startLocToP1Dist = routeDistances['C_P1'] || 0.5;
    const speedSoloMod = settings.scenario === 'lluvia' ? settings.walkSpeedSolo * 0.8 : settings.walkSpeedSolo;
    const departureSpeed = settings.firstLegTransport === 'moto' ? 32 : (settings.firstLegTransport === 'bici' ? 15 : speedSoloMod);
    const departureMinutes = Math.round((startLocToP1Dist / departureSpeed) * 60);
    const departureTimeDate = new Date(curDate.getTime() - departureMinutes * 60000);

    let currentSimTime = departureTimeDate.getTime();
    const frames: SimulationFrame[] = [];
    const stepDurations = sequenceData.steps.reduce(
      (acc, s) => ({ ...acc, [s.id]: s.durationMinutes }),
      {} as { [key: string]: number }
    );

    const pickedUp: Record<string, boolean> = { S: false, F: false };
    const pickTime: Record<string, number> = { S: 0, F: 0 };
    const droppedOff: Record<string, boolean> = { S: false, F: false };

    const grouped: { [key: string]: typeof rawTrajectory } = {};
    rawTrajectory.forEach((p) => {
      if (!grouped[p.stepId]) grouped[p.stepId] = [];
      grouped[p.stepId].push(p);
    });

    sequenceData.steps.forEach((step) => {
      const stepPts = grouped[step.id] || [];
      if (stepPts.length === 0) return;

      const durMins = stepDurations[step.id] || 0;
      const count = stepPts.length;
      const msPerPoint = count > 1 ? (durMins * 60 * 1000) / (count - 1) : 0;

      stepPts.forEach((pt, index) => {
        const pointTimeVal = currentSimTime + index * msPerPoint;
        const ptDate = new Date(pointTimeVal);
        const timeStr = ptDate.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        if (pt.type === 'pick' && pt.dogId) {
          pickedUp[pt.dogId] = true;
          pickTime[pt.dogId] = pointTimeVal;
        }
        if (pt.type === 'drop' && pt.dogId) {
          droppedOff[pt.dogId] = true;
        }

        const pack: string[] = [];
        if (pickedUp.S && !droppedOff.S) pack.push('S');
        if (pickedUp.F && !droppedOff.F) pack.push('F');

        let avatarEmoji = '🚶‍♂️';
        if (pt.type === 'bus_ride') avatarEmoji = '🚌';
        else if (pt.type === 'upb') avatarEmoji = '🎓';
        else if (pack.length > 0) {
          avatarEmoji = '🚶‍♂️' + pack.map((id) => (id === 'S' ? '🍊' : '🍇')).join('');
        }

        const activeTimers: { S?: number; F?: number } = {};
        const finishedDogs: ('S' | 'F')[] = [];

        (['S', 'F'] as const).forEach((dogId) => {
          if (droppedOff[dogId]) {
            finishedDogs.push(dogId);
          } else if (pickedUp[dogId]) {
            activeTimers[dogId] = Math.max(0, Math.floor((pointTimeVal - pickTime[dogId]) / 60000));
          }
        });

        frames.push({
          lat: pt.lat,
          lng: pt.lng,
          timestamp: pointTimeVal,
          timeStr,
          emoji: avatarEmoji,
          message: pt.info,
          activeTimers,
          finishedDogs,
        });
      });

      currentSimTime += durMins * 60 * 1000;
      if (step.type === 'bus_wait') {
        currentSimTime += 5 * 60 * 1000;
      }
    });

    return frames;
  }, [rawTrajectory, sequenceData.steps, routeDistances, settings]);

  // Ciclo de animación en vivo
  useEffect(() => {
    if (!simulationPlaying || simulationFrames.length === 0) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prevIndex) => {
        if (prevIndex >= simulationFrames.length - 1) {
          setSimulationPlaying(false);
          return 0;
        }
        return prevIndex + 1;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [simulationPlaying, simulationFrames]);

  const activeFrame = useMemo(() => {
    if (simulationFrames.length === 0) return null;
    return simulationFrames[currentFrameIndex] || null;
  }, [simulationFrames, currentFrameIndex]);

  const handleAddLog = (newLog: Omit<TripLog, 'id'>) => {
    const log: TripLog = {
      ...newLog,
      id: `log_${Date.now()}`,
    };
    setLogs((prev) => [log, ...prev]);
  };

  const handleClearLogs = () => {
    if (window.confirm('¿Quieres borrar todo el historial registrado?')) {
      setLogs([]);
    }
  };

  const handleTrackToday = () => {
    const mins = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const diff = mins(targetClassInfo.time) - mins(sequenceData.finalArrival);
    let status: 'early' | 'on_time' | 'late' = 'on_time';
    if (diff >= 15) status = 'early';
    else if (diff < 0) status = 'late';

    handleAddLog({
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      day: settings.day,
      strategy: settings.strategy,
      scheduledArrival: sequenceData.finalArrival,
      targetClassTime: targetClassInfo.time,
      status,
      dogsWalked: isThreeDogs ? 3 : 2,
      notes: 'Estimación calculada agregada automáticamente.',
    });

    setActiveTab('logs');
  };

  return (
    <div
      className={`w-full bg-slate-50 dark:bg-slate-900 flex flex-col lg:flex-row overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl transition-all duration-300 ${
        isExpanded ? 'fixed inset-4 z-50 rounded-2xl shadow-2xl h-[calc(100vh-2rem)]' : 'h-[860px]'
      }`}
    >
      {/* 1. Panel Lateral Izquierdo (Controles, Horarios, Configuración e Historial) */}
      <aside className="w-full lg:w-[440px] xl:w-[480px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-[52%] lg:h-full z-20 shrink-0 shadow-sm relative overflow-hidden">
        {/* Cabezote Oficial de UniPaseo */}
        <div className="p-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-1 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold shadow-sm shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-lg tracking-tight block text-slate-900 dark:text-white">
                  UniPaseo
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold block uppercase tracking-wider">
                  Simulador de Paseos y Rutinas UPB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDogManagerOpen(true)}
                title="Administrar clientes caninos (agregar, quitar o ajustar tarifas)"
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800 flex items-center gap-1"
              >
                <Dog className="w-3.5 h-3.5" /> Clientes Caninos 🐾
              </button>
              <button
                onClick={handleResetLocations}
                title="Restablecer coordenadas oficiales en Montería"
                className="text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Reiniciar Pines 📍
              </button>
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                title={isExpanded ? 'Contraer simulador' : 'Expandir a pantalla completa'}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-medium mt-2">
            Planifica tus caminatas con Sienna y Frida garantizando la puntualidad en tus clases semestrales en la UPB Montería.
          </p>
        </div>

        {/* Selectores Globales Rápidos */}
        <div className="p-3.5 bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Día de la semana
            </label>
            <select
              value={settings.day}
              onChange={(e) => {
                const dayValue = e.target.value as DayOfWeek;
                setSettings((prev) => ({
                  ...prev,
                  day: dayValue,
                }));
              }}
              className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 shadow-xs outline-hidden focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
            >
              <option value="lunes">🗓️ Lunes</option>
              <option value="martes">🗓️ Martes</option>
              <option value="miercoles">🗓️ Miércoles</option>
              <option value="jueves">🗓️ Jueves</option>
              <option value="viernes">🗓️ Viernes</option>
            </select>
          </div>

          <div>
            <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Estrategia Devolución
            </label>
            <select
              value={settings.strategy}
              onChange={(e) => setSettings((prev) => ({ ...prev, strategy: e.target.value as StrategyType }))}
              className="w-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-slate-100 shadow-xs outline-hidden focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900"
            >
              <option value="zigzag">⚡ Zigzag Activo</option>
              <option value="lineal">📏 Ida y Vuelta Lineal</option>
              <option value="terminar_m">🏁 Terminar en último</option>
            </select>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-500 font-bold px-3 py-1.5 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-1.5 px-2.5 text-center text-[11px] rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'timeline'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Secuencia & Horarios
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`py-1.5 px-2.5 text-center text-[11px] rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'config'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Configuración
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-1.5 px-2.5 text-center text-[11px] rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'logs'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Historial de Tiempos
          </button>
          <button
            onClick={() => setActiveTab('realwalk')}
            className={`py-1.5 px-2.5 text-center text-[11px] rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'realwalk'
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Paseo Real (GPS)
          </button>
          <button
            onClick={() => setActiveTab('movisinu')}
            className={`py-1.5 px-2.5 text-center text-[11px] rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 ${
              activeTab === 'movisinu'
                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-extrabold'
                : 'hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Bus className="w-3.5 h-3.5" /> Movisinú MetroSinú 🚍
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-nav-scrollbar">
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Botonera de Control de Simulación */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    if (simulationPlaying) {
                      setSimulationPlaying(false);
                    } else {
                      setCurrentFrameIndex(0);
                      setSimulationPlaying(true);
                    }
                  }}
                  disabled={isComputing}
                  className={`py-2.5 px-3.5 rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                    isComputing
                      ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                      : simulationPlaying
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {simulationPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-current text-white" /> Pausar Paseo
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-white" /> Iniciar Tránsito
                    </>
                  )}
                </button>

                <button
                  onClick={handleTrackToday}
                  disabled={isComputing}
                  className="py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold bg-white dark:bg-slate-850 text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Registrar Estimado
                </button>
              </div>

              {/* Callout Informativo de Estrategia */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-150/40 dark:border-indigo-900/50 flex gap-2">
                <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-indigo-900 dark:text-indigo-200 leading-normal font-medium">
                  <strong>Estrategia recomendada:</strong>{' '}
                  {settings.strategy === 'zigzag'
                    ? 'El "Zigzag" distribuye equitativamente el cansancio general pero duplica ciertos tramos peatonales.'
                    : settings.strategy === 'lineal'
                    ? 'La ruta "Lineal" minimiza la caminata solitaria, entregando en orden directo.'
                    : 'La estrategia "Terminar en el último" optimiza el enlace final con la buseta escolar o MetroSinú en la Carrera 14.'}
                </div>
              </div>

              {isComputing ? (
                <div className="flex flex-col items-center justify-center p-10 text-slate-400">
                  <Clock className="w-7 h-7 text-indigo-500 animate-spin mb-2" />
                  <span className="text-xs font-bold text-slate-500">Recalculando rutas reales de Montería...</span>
                </div>
              ) : (
                <Timeline
                  steps={sequenceData.steps}
                  finalArrival={sequenceData.finalArrival}
                  targetClassTime={targetClassInfo.time}
                  targetClassName={targetClassInfo.name}
                  activeDogs={['S', 'F']}
                  settings={settings}
                  metas={{ S: settings.goalSienna, F: settings.goalFrida }}
                  dogWalkDurations={sequenceData.dogWalkDurations}
                />
              )}
            </div>
          )}

          {activeTab === 'config' && (
            <ConfigPanel
              settings={settings}
              onChangeSettings={setSettings}
              isThreeDogs={false}
              onOpenDogManager={() => setIsDogManagerOpen(true)}
            />
          )}

          {activeTab === 'logs' && (
            <HistoryLog
              logs={logs}
              realLogs={realLogs}
              onAddLog={handleAddLog}
              onClearLogs={handleClearLogs}
              onUpdateRealLog={(logId, updates) => {
                setRealLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, ...updates } : l)));
              }}
            />
          )}
        </div>

        {/* Widget de Regreso a Clases UPB */}
        <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="bg-indigo-50/80 dark:bg-indigo-950/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase mb-1 tracking-wider">
              Regreso a Clases UPB Montería
            </p>
            <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 h-2 rounded-full mb-1.5 overflow-hidden">
              <div className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full w-3/4"></div>
            </div>
            <p className="text-xs text-indigo-900 dark:text-indigo-200 leading-normal">
              Quedan <strong className="font-bold text-indigo-950 dark:text-white">31 días</strong> para el inicio académico. ¡Simula tus horas de partida hoy!
            </p>
          </div>
        </div>
      </aside>

      {/* 2. Visor Cartográfico Principal Derecho (Leaflet + HUD de Simulación en Vivo) */}
      <main className="flex-1 h-[48%] lg:h-full relative overflow-hidden bg-slate-100 dark:bg-slate-950 min-h-[380px]">
        {activeTab === 'realwalk' ? (
          <RealWalk onSaveWalk={(log) => setRealLogs((prev) => [...prev, log])} />
        ) : (
          <>
            <MapContainer
              locations={locations}
              startLocationId={settings.startLocation}
              activeDogs={['S', 'F']}
              routePaths={routePaths}
              onLocationDrag={handleLocationDrag}
              simulationPlaying={simulationPlaying}
              simulationFrame={activeFrame}
            />

            {/* Overlay HUD en Vivo de Simulación Activa */}
            {simulationPlaying && activeFrame && (
              <div className="absolute top-4 left-4 right-4 md:left-1/2 md:right-auto md:w-[460px] md:-translate-x-1/2 z-[1000] bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-2.5 transition-all">
                {/* Cabecera del Pulso */}
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping shrink-0" />
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                      PULSO SIMULADOR MONTERÍA
                    </span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Paseo Coordinado UPB
                  </span>
                </div>

                {/* Reloj y Estado de Tránsito */}
                <div className="flex items-baseline justify-between py-1">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      Cronómetro Paseo
                    </span>
                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
                      {activeFrame.timeStr} <span className="text-xs text-slate-400 font-normal">AM</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                      Estado de Tránsito
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px] block mt-1">
                      {activeFrame.message}
                    </span>
                  </div>
                </div>

                {/* Temporizadores Individuales de Perros */}
                <div className="grid grid-cols-2 gap-2 border-t border-slate-200/80 dark:border-slate-800 pt-2.5">
                  {/* Sienna */}
                  <div
                    className={`p-2 rounded-xl flex flex-col items-center border transition-all ${
                      activeFrame.finishedDogs.includes('S')
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : activeFrame.activeTimers.S !== undefined
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-wider block mb-0.5">
                      SIENNA ({settings.goalSienna}m)
                    </span>
                    <span className="font-extrabold text-sm">
                      {activeFrame.finishedDogs.includes('S')
                        ? '✓ FIN'
                        : activeFrame.activeTimers.S !== undefined
                        ? `${activeFrame.activeTimers.S} min`
                        : 'ESPERA'}
                    </span>
                  </div>

                  {/* Frida */}
                  <div
                    className={`p-2 rounded-xl flex flex-col items-center border transition-all ${
                      activeFrame.finishedDogs.includes('F')
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : activeFrame.activeTimers.F !== undefined
                        ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-wider block mb-0.5">
                      FRIDA ({settings.goalFrida}m)
                    </span>
                    <span className="font-extrabold text-sm">
                      {activeFrame.finishedDogs.includes('F')
                        ? '✓ FIN'
                        : activeFrame.activeTimers.F !== undefined
                        ? `${activeFrame.activeTimers.F} min`
                        : 'ESPERA'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Leyenda Cartográfica Flotante */}
            <div className="absolute bottom-5 right-5 z-[500] bg-white/95 dark:bg-slate-900/95 hover:bg-white dark:hover:bg-slate-900 transition-all text-slate-800 dark:text-slate-100 p-3.5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 text-[10px] space-y-1.5 select-none font-medium backdrop-blur-xs max-w-[210px]">
              <h5 className="font-bold uppercase text-indigo-600 dark:text-indigo-400 text-[10px] border-b border-slate-100 dark:border-slate-800 pb-1.5">
                Leyenda Cartográfica
              </h5>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" /> Origen (Casa)
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] shrink-0" /> Sienna (Palmanova)
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6] shrink-0" /> Frida (Castellana 101)
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" /> Paradero Carrera 14
              </div>
              <div className="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" /> Llegada UPB Montería
              </div>
            </div>
          </>
        )}
      </main>
      <DogManagerModal
        isOpen={isDogManagerOpen}
        onClose={() => setIsDogManagerOpen(false)}
        dogs={customDogs}
        onSaveDogs={handleSaveCustomDogs}
      />
    </div>
  );
}
