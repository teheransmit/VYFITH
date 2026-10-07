'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Navigation, MapPin, Plane, Car, Bus, Train, Home, Compass, Eye, Layers } from 'lucide-react';

interface Waypoint {
  id: string;
  name: string;
  leg: string;
  coords: [number, number];
  type: 'home' | 'airport' | 'bus' | 'metro' | 'airbnb';
  desc: string;
  time: string;
  badge: string;
}

const waypoints: Waypoint[] = [
  {
    id: 'p1',
    name: 'Casa Santiago (Montería)',
    leg: 'Tramo 1: Urbano Montería',
    coords: [8.7554, -75.8752],
    type: 'home',
    desc: 'Salida en Taxi desde Cl 35 # 15B-18 hacia Los Garzones.',
    time: '10:25 AM',
    badge: 'Origen',
  },
  {
    id: 'p2',
    name: 'Aeropuerto Los Garzones (MTR)',
    leg: 'Tramo 1 / 2: Conexión Aérea',
    coords: [8.8242, -75.8258],
    type: 'airport',
    desc: 'Llegada 10:48 AM. Filtro de seguridad (Rayos X) y embarque 11:58 AM.',
    time: '10:48 AM',
    badge: 'Vuelo JA5483',
  },
  {
    id: 'p3',
    name: 'Aeropuerto José María Córdova (MDE)',
    leg: 'Tramo 2 / 3: Rionegro',
    coords: [6.1645, -75.4231],
    type: 'airport',
    desc: 'Aterrizaje 01:49 PM. Salida a bahía de buses blancos.',
    time: '01:49 PM',
    badge: 'Llegada Antioquia',
  },
  {
    id: 'p4',
    name: 'Medellín Centro (San Diego / Nutibara)',
    leg: 'Tramo 3: Bus por Túnel de Oriente',
    coords: [6.2365, -75.5695],
    type: 'bus',
    desc: 'Llegada en Combuses Nutibara ($15.000 COP). Conexión a Metro.',
    time: '03:00 PM',
    badge: 'Bus MDE',
  },
  {
    id: 'p5',
    name: 'PAC Estación San Antonio (Metro)',
    leg: 'Tramo 4: Metro Medellín',
    coords: [6.247, -75.5694],
    type: 'metro',
    desc: 'Expedición de Tarjeta Cívica personalizada con cédula física.',
    time: '03:30 PM',
    badge: 'Tarjeta Cívica',
  },
  {
    id: 'p6',
    name: 'Airbnb Medellín (Destino Final)',
    leg: 'Tramo 5: Alojamiento',
    coords: [6.242, -75.578],
    type: 'airbnb',
    desc: 'Check-in y descanso. 100% Cubierto y liquidado ($0.00 COP).',
    time: '04:15 PM',
    badge: 'Destino',
  },
];

export default function Rome2RioRouteMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [activeLeg, setActiveLeg] = useState<'all' | 'monteria' | 'vuelo' | 'medellin'>('all');
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Carga dinámica de Leaflet para garantizar compatibilidad con SSR en Next.js
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      // 1. Cargar CSS de Leaflet si no existe
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Cargar Script de Leaflet si no existe
      if (!(window as any).L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      const L = (window as any).L;
      if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

      // Inicializar Mapa centrado en la ruta Colombia (entre Montería y Medellín)
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: false,
      }).setView([7.5, -75.6], 7);

      mapInstanceRef.current = map;

      // Capas de mapas: CARTO Voyager (con API Key oficial de Santiago) y OpenStreetMap Estándar
      const cartoKey = 'cb1_4day_1_177bb35db5bb24bb03734726';
      const cartoVoyager = L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoKey}`,
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
          subdomains: 'abcd',
        }
      );

      const osmStandard = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      });

      // Añadir CARTO Voyager por defecto (sin marca de agua)
      cartoVoyager.addTo(map);

      // Selector de capas (CARTO Voyager vs OpenStreetMap)
      L.control.layers(
        {
          'CARTO Voyager (Sin marca)': cartoVoyager,
          'OpenStreetMap Directo': osmStandard,
        },
        undefined,
        { position: 'topright' }
      ).addTo(map);

      // Iconos personalizados con estilos SVG limpios
      const createCustomIcon = (bgColor: string, text: string) => {
        return L.divIcon({
          className: 'custom-leaflet-marker',
          html: `<div style="
            background: ${bgColor};
            color: white;
            font-size: 11px;
            font-weight: 800;
            padding: 5px 8px;
            border-radius: 9999px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border: 2px solid white;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
          ">${text}</div>`,
          iconSize: [80, 30],
          iconAnchor: [40, 15],
        });
      };

      // Marcadores de waypoints
      waypoints.forEach((wp) => {
        let color = '#0f766e';
        let iconText = '📍';
        if (wp.type === 'home') {
          color = '#d97706';
          iconText = '🏠 Casa';
        } else if (wp.type === 'airport' && wp.id === 'p2') {
          color = '#0284c7';
          iconText = '✈️ Los Garzones';
        } else if (wp.type === 'airport' && wp.id === 'p3') {
          color = '#0284c7';
          iconText = '✈️ J.M. Córdova';
        } else if (wp.type === 'bus') {
          color = '#2563eb';
          iconText = '🚌 Nutibara';
        } else if (wp.type === 'metro') {
          color = '#059669';
          iconText = '🚆 PAC Cívica';
        } else if (wp.type === 'airbnb') {
          color = '#7c3aed';
          iconText = '🏨 Airbnb';
        }

        const marker = L.marker(wp.coords, {
          icon: createCustomIcon(color, iconText),
        }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
            <div style="font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase;">${wp.leg}</div>
            <div style="font-size: 14px; font-weight: 800; color: #0f172a; margin: 2px 0;">${wp.name}</div>
            <div style="font-size: 12px; color: #334155; margin-bottom: 6px;">${wp.desc}</div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; color: #0f766e;">
              <span>Horario: ${wp.time}</span>
              <span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">${wp.badge}</span>
            </div>
          </div>
        `);
      });

      // 1. Línea Terrestre Montería (Taxi: Cl 35 ➔ Aeropuerto MTR)
      L.polyline(
        [
          [8.7554, -75.8752],
          [8.775, -75.855],
          [8.8242, -75.8258],
        ],
        {
          color: '#f59e0b',
          weight: 4,
          opacity: 0.85,
        }
      ).addTo(map);

      // 2. Línea Aérea (Vuelo JetSMART JA5483: MTR ➔ MDE)
      // Trayectoria en arco suave
      const midLat = (8.8242 + 6.1645) / 2;
      const midLng = ( -75.8258 + -75.4231 ) / 2 - 0.25;
      L.polyline(
        [
          [8.8242, -75.8258],
          [midLat, midLng],
          [6.1645, -75.4231],
        ],
        {
          color: '#0d9488',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.9,
        }
      ).addTo(map);

      // 3. Línea Bus Aeropuerto Rionegro ➔ San Diego (Túnel de Oriente)
      L.polyline(
        [
          [6.1645, -75.4231],
          [6.195, -75.475],
          [6.2365, -75.5695],
        ],
        {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.85,
        }
      ).addTo(map);

      // 4. Línea Urbana San Diego ➔ PAC San Antonio ➔ Airbnb
      L.polyline(
        [
          [6.2365, -75.5695],
          [6.247, -75.5694],
          [6.242, -75.578],
        ],
        {
          color: '#8b5cf6',
          weight: 4,
          dashArray: '5, 5',
          opacity: 0.85,
        }
      ).addTo(map);

      setMapLoaded(true);
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Función para enfocar diferentes tramos del mapa
  const focusLeg = (leg: 'all' | 'monteria' | 'vuelo' | 'medellin') => {
    setActiveLeg(leg);
    const map = mapInstanceRef.current;
    const L = (window as any).L;
    if (!map || !L) return;

    if (leg === 'all') {
      map.flyToBounds(
        [
          [8.85, -76.0],
          [6.1, -75.3],
        ],
        { duration: 1.2 }
      );
    } else if (leg === 'monteria') {
      map.flyTo([8.7898, -75.8505], 12, { duration: 1.2 });
    } else if (leg === 'vuelo') {
      map.flyToBounds(
        [
          [8.8242, -75.8258],
          [6.1645, -75.4231],
        ],
        { duration: 1.2 }
      );
    } else if (leg === 'medellin') {
      map.flyTo([6.22, -75.52], 12, { duration: 1.2 });
    }
  };

  return (
    <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xs">
      {/* Barra de Controles y Filtros de Tramos */}
      <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-400/30">
              <Navigation className="w-4 h-4" />
            </span>
            <h4 className="text-sm sm:text-base font-extrabold tracking-tight text-white">
              Mapa Interactivo de Ruta (OpenStreetMap / Rome2Rio)
            </h4>
          </div>
          <p className="text-xs text-slate-300">
            Trazado geográfico en vivo: Montería (Calle 35 ➔ Aeropuerto MTR) ✈️ Vuelo JetSMART ➔ Rionegro (MDE) 🚌 Medellín 🏨 Airbnb.
          </p>
        </div>

        {/* Botones de enfoque por tramo */}
        <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center">
          <button
            onClick={() => focusLeg('all')}
            className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeLeg === 'all'
                ? 'bg-teal-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Ruta Completa
          </button>
          <button
            onClick={() => focusLeg('monteria')}
            className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeLeg === 'monteria'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            1. Montería
          </button>
          <button
            onClick={() => focusLeg('vuelo')}
            className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeLeg === 'vuelo'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            2. Vuelo Aéreo
          </button>
          <button
            onClick={() => focusLeg('medellin')}
            className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-bold transition-all ${
              activeLeg === 'medellin'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            3. Valle de Aburrá
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa OpenStreetMap / Leaflet */}
      <div className="relative w-full h-[420px] bg-slate-100">
        <div ref={mapContainerRef} className="w-full h-full z-10" />

        {/* Leyenda Flotante sobre el Mapa */}
        <div className="absolute bottom-3 left-3 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-md text-xs max-w-xs pointer-events-auto">
          <span className="font-bold text-slate-900 block mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-600" /> Convenciones de Ruta
          </span>
          <div className="space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-amber-500 rounded-full" />
              <span>Tramo Urbano Montería (Taxi ~12.5 km)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-teal-600 rounded-full border-t border-dashed border-teal-300" />
              <span>Vuelo JetSMART JA5483 (~280 km)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-blue-500 rounded-full" />
              <span>Bus Túnel de Oriente MDE ➔ San Diego (~24 km)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-purple-500 rounded-full" />
              <span>Metro Línea A ➔ PAC San Antonio ➔ Airbnb</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
