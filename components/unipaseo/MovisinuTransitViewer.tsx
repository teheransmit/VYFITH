'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Movisinú MetroSinú Transit Viewer
 * Visor e Integración del Sistema de Transporte Colectivo y Buses Urbanos de Montería (MetroSinú / Recaudar Sinú)
 * Conexión oficial: https://recaudarsinu.com/apps/movisinu/
 * API Oficial: https://data.recaudarsinu.com/api/rutas
 */

import React, { useState, useEffect } from 'react';
import {
  Bus,
  ExternalLink,
  Smartphone,
  Navigation,
  Search,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Bike,
  ShieldCheck,
  Download,
} from 'lucide-react';

interface MovisinuRoute {
  id?: number | string;
  nombre?: string;
  codigo?: string;
  kmz?: string;
  color?: string;
  descripcion?: string;
  frecuencia?: string;
}

// 18 Rutas oficiales de MetroSinú Montería
const FALLBACK_ROUTES: MovisinuRoute[] = [
  {
    id: 3,
    codigo: 'RUTA 03',
    nombre: 'AEROPUERTO — UPB MONTERÍA (KM 8 VÍA CERETÉ)',
    descripcion: 'Conecta el casco urbano de Montería con el acceso peatonal del Campus UPB y el Aeropuerto Los Garzones.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_03_aeropuerto.kmz',
    frecuencia: 'Cada 12-15 min en hora pico matutina (06:00 - 08:30 AM)',
    color: '#2563eb',
  },
  {
    id: 1,
    codigo: 'RUTA 01',
    nombre: 'CANTACLARO — CENTRO',
    descripcion: 'Troncal suroriental hacia el centro comercial e institucional de Montería.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_01_cantaclaro.kmz',
    frecuencia: 'Cada 10 min',
    color: '#059669',
  },
  {
    id: 2,
    codigo: 'RUTA 02',
    nombre: 'MOGAMBO — CENTRO — TERMINAL',
    descripcion: 'Recorrido sur-norte desde Mogambo conectando terminal de transportes.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_02_mogambo.kmz',
    frecuencia: 'Cada 12 min',
    color: '#d97706',
  },
  {
    id: 4,
    codigo: 'RUTA 04',
    nombre: 'EL DORADO — CENTRO',
    descripcion: 'Margen izquierda del Río Sinú hacia el centro.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_04_eldorado.kmz',
    frecuencia: 'Cada 15 min',
    color: '#7c3aed',
  },
  {
    id: 5,
    codigo: 'RUTA 05',
    nombre: 'LA CASTELLANA — CENTRO',
    descripcion: 'Pasa cerca de la zona de paseo (Castellana 101, Palmanova).',
    kmz: 'https://recaudarsinu.com/rutas/ruta_05_castellana.kmz',
    frecuencia: 'Cada 12 min',
    color: '#ea580c',
  },
  {
    id: 6,
    codigo: 'RUTA 06',
    nombre: 'MOCARÍ — CENTRO',
    descripcion: 'Sector norte industrial y residencial hacia el centro.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_06_mocari.kmz',
    frecuencia: 'Cada 15 min',
    color: '#0891b2',
  },
  {
    id: 7,
    codigo: 'RUTA 07',
    nombre: 'KM 12 — TERMINAL',
    descripcion: 'Eje perimetral oriental conectando veredas y terminal.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_07_km12.kmz',
    frecuencia: 'Cada 20 min',
    color: '#4f46e5',
  },
  {
    id: 8,
    codigo: 'RUTA 08',
    nombre: 'LOS GARZONES — CENTRO',
    descripcion: 'Corredor norte vía aeropuerto hacia la Carrera 2da.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_08_garzones.kmz',
    frecuencia: 'Cada 15 min',
    color: '#16a34a',
  },
  {
    id: 9,
    codigo: 'RUTA 09',
    nombre: 'RANCHO GRANDE — MARGEN IZQUIERDA',
    descripcion: 'Alimentador sector occidental río Sinú.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_09_ranchogrande.kmz',
    frecuencia: 'Cada 18 min',
    color: '#9333ea',
  },
  {
    id: 10,
    codigo: 'RUTA 10',
    nombre: 'VILLA MELISSA — CENTRO',
    descripcion: 'Sector sur conectando con la Avenida Circunvalar.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_10_villamelissa.kmz',
    frecuencia: 'Cada 15 min',
    color: '#e11d48',
  },
  {
    id: 11,
    codigo: 'RUTA 11',
    nombre: 'LA PRADERA — TERMINAL',
    descripcion: 'Eje este residencial hacia terminal y universidades.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_11_pradera.kmz',
    frecuencia: 'Cada 12 min',
    color: '#0d9488',
  },
  {
    id: 12,
    codigo: 'RUTA 12',
    nombre: 'BOSTON — CENTRO',
    descripcion: 'Conexión sur con Mercado del Sur y Centro.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_12_boston.kmz',
    frecuencia: 'Cada 15 min',
    color: '#ca8a04',
  },
  {
    id: 13,
    codigo: 'RUTA 13',
    nombre: 'SUCRE — CENTRO',
    descripcion: 'Sector centro-sur tradicional de Montería.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_13_sucre.kmz',
    frecuencia: 'Cada 15 min',
    color: '#475569',
  },
  {
    id: 14,
    codigo: 'RUTA 14',
    nombre: 'PASEO DE LA CASTELLANA — C.C. BUENAVISTA',
    descripcion: 'Circuito norte que cubre la zona comercial de La Castellana.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_14_castellana_buenavista.kmz',
    frecuencia: 'Cada 12 min',
    color: '#f59e0b',
  },
  {
    id: 15,
    codigo: 'RUTA 15',
    nombre: 'FURATENA — CENTRO',
    descripcion: 'Troncal sur hacia el centro comercial.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_15_furatena.kmz',
    frecuencia: 'Cada 15 min',
    color: '#65a30d',
  },
  {
    id: 16,
    codigo: 'RUTA 16',
    nombre: 'VILLA CIELO — CENTRO',
    descripcion: 'Extremo oriental conectando con Avenida Circunvalar.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_16_villacielo.kmz',
    frecuencia: 'Cada 20 min',
    color: '#0284c7',
  },
  {
    id: 17,
    codigo: 'RUTA 17',
    nombre: 'SANTA ELENA — CENTRO',
    descripcion: 'Sector suroriental hacia mercado y universidades.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_17_santaelena.kmz',
    frecuencia: 'Cada 15 min',
    color: '#c026d3',
  },
  {
    id: 18,
    codigo: 'RUTA 18',
    nombre: 'CIRCULAR UNIVERSITARIA (UPB — UNICÓRDOBA — UNISINÚ)',
    descripcion: 'Circuito estudiantil que conecta los 3 campus universitarios principales.',
    kmz: 'https://recaudarsinu.com/rutas/ruta_18_circular_universitaria.kmz',
    frecuencia: 'Cada 15 min en días hábiles académicos',
    color: '#dc2626',
  },
];

export default function MovisinuTransitViewer() {
  const [routes, setRoutes] = useState<MovisinuRoute[]>(FALLBACK_ROUTES);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const fetchApiRoutes = async () => {
      setLoading(true);
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://data.recaudarsinu.com/api/rutas', {
          signal: controller.signal,
          mode: 'cors',
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (active && Array.isArray(data) && data.length > 0) {
            setRoutes(data);
            setApiOnline(true);
          }
        } else {
          if (active) setApiOnline(false);
        }
      } catch {
        if (active) setApiOnline(false);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchApiRoutes();
    return () => {
      active = false;
    };
  }, []);

  const filteredRoutes = routes.filter((r) => {
    const q = searchQuery.toLowerCase();
    const name = (r.nombre || '').toLowerCase();
    const code = (r.codigo || '').toLowerCase();
    const desc = (r.descripcion || '').toLowerCase();
    return name.includes(q) || code.includes(q) || desc.includes(q);
  });

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <Bus className="w-64 h-64" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-white/20 backdrop-blur-md">
                <Bus className="w-6 h-6 text-white" />
              </span>
              <div>
                <h3 className="text-base font-black uppercase tracking-wide">
                  Movisinú — MetroSinú Montería
                </h3>
                <p className="text-xs text-sky-100">
                  Rutas oficiales de transporte público colectivo y seguimiento en vivo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                  apiOnline
                    ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                    : 'bg-white/15 text-white border border-white/20'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                {apiOnline ? 'API Recaudar Sinú Conectada' : '18 Rutas Locales Listas'}
              </span>
            </div>
          </div>

          <p className="text-xs text-sky-100/90 leading-relaxed max-w-2xl">
            La Alcaldía de Montería y Recaudar Sinú SAS lanzaron la aplicación oficial <strong>Movisinú</strong> para visualizar las rutas de los buses MetroSinú y consultar su ubicación en tiempo real. Santiago siempre se transporta en <strong>bicicleta</strong> (~15-18 km/h), pero este sistema es la alternativa perfecta para días de lluvia o retorno desde el campus UPB (Km 8 Vía Cereté).
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href="https://recaudarsinu.com/apps/movisinu/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-sky-50 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" /> App Web Movisinú
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.recaudar.movisinu"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-900/60 hover:bg-blue-900/90 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Descargar en Google Play
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>

            <a
              href="https://recaudarsinu.com/rutas/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/40 hover:bg-sky-500/60 text-white border border-white/20 font-bold text-xs backdrop-blur-md transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4" /> Visor de Rutas en Vivo
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* 2. Highlight Card: Ruta 3 (UPB Montería Km 8) */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 dark:from-slate-800 dark:via-slate-800/90 dark:to-slate-900 p-5 rounded-3xl border-2 border-indigo-200 dark:border-indigo-700 shadow-md">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-[11px] font-black tracking-wider">
                ⭐ RUTA CLAVE UPB
              </span>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                Ruta 03 — Aeropuerto / UPB Montería
              </span>
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              Corredor Universitario Km 8 Vía Cereté
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-normal">
              Esta es la ruta de MetroSinú que pasa justo por la entrada peatonal del campus <strong>UPB Montería</strong>. Puedes abordarla en la parada de la <strong>Carrera 14</strong> al terminar tu paseo canino con Sienna y Frida, o usar tu bicicleta para el recorrido directo de 25-28 min.
            </p>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Frecuencia: Cada 12-15 min</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
              <Bike className="w-3.5 h-3.5" />
              <span>Modo Santiago: Bici (15 km/h)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-rose-500" /> Parada de enlace: Carrera 14 con Calle 64 (La Castellana)
          </span>

          <a
            href="https://recaudarsinu.com/rutas/ruta_03_aeropuerto.kmz"
            download
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Descargar Traza KMZ Oficial
          </a>
        </div>
      </div>

      {/* 3. Search and Routes Explorer */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-black uppercase text-slate-700 dark:text-slate-200 tracking-wider">
              Catálogo de Rutas MetroSinú ({filteredRoutes.length} disponibles)
            </h4>
            <p className="text-[11px] text-slate-500">
              Filtra por nombre de barrio, código de ruta o destino
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar (ej. UPB, Castellana, Centro)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Grid of routes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRoutes.map((route, idx) => {
            const isUPB = (route.nombre || '').includes('UPB') || (route.codigo || '').includes('03') || (route.codigo || '').includes('18');

            return (
              <div
                key={route.id ?? idx}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isUPB
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 shadow-xs'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                      {route.codigo || `Ruta ${route.id}`}
                    </span>
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                      {route.nombre}
                    </h5>
                  </div>

                  {isUPB && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-600 text-white shrink-0">
                      UPB
                    </span>
                  )}
                </div>

                {route.descripcion && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {route.descripcion}
                  </p>
                )}

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 font-medium">
                    {route.frecuencia || 'Frecuencia regular'}
                  </span>

                  {route.kmz && (
                    <a
                      href={route.kmz}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      KMZ <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
