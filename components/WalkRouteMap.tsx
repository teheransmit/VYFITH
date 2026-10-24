'use client';

import { useEffect, useRef, useState } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

interface WalkRouteMapProps {
  selectedDogIds: string[];
  startLocation: 'centro' | 'abuela';
}

const locations = {
  centro: [8.76132, -75.87928] as [number, number],
  abuela: [8.75365, -75.87439] as [number, number],
  'dog-sienna': [8.77228, -75.85933] as [number, number],
  'dog-frida': [8.77418, -75.86532] as [number, number],
  upb: [8.80457, -75.8504] as [number, number],
};

export default function WalkRouteMap({ selectedDogIds, startLocation }: WalkRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      if (!document.getElementById('walk-leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'walk-leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('No se pudo cargar el mapa'));
          document.body.appendChild(script);
        });
      }

      if (cancelled || !containerRef.current || !window.L) return;
      const L = window.L;
      const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView([8.775, -75.864], 14);
      mapRef.current = map;
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const start = locations[startLocation];
      const activeDogs = selectedDogIds.filter((id): id is 'dog-sienna' | 'dog-frida' => id in locations);
      const route = [start, ...activeDogs.map((id) => locations[id]), locations.upb];
      L.polyline(route, { color: '#4f46e5', weight: 5, opacity: 0.8, dashArray: '8 7' }).addTo(map);

      const marker = (point: [number, number], label: string, color: string) => {
        L.marker(point, {
          icon: L.divIcon({
            className: 'walk-map-marker',
            html: `<div style="background:${color};border:2px solid white;border-radius:999px;box-shadow:0 2px 8px #0005;color:white;font-size:16px;width:34px;height:34px;display:flex;align-items:center;justify-content:center">${label}</div>`,
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        }).addTo(map);
      };

      marker(start, '🏠', '#059669');
      if (activeDogs.includes('dog-sienna')) marker(locations['dog-sienna'], '🍊', '#f97316');
      if (activeDogs.includes('dog-frida')) marker(locations['dog-frida'], '🍇', '#8b5cf6');
      marker(locations.upb, '🎓', '#dc2626');
      setLoaded(true);
    };

    loadMap().catch(() => setLoaded(false));
    return () => {
      cancelled = true;
      const map = mapRef.current as { remove?: () => void } | null;
      map?.remove?.();
      mapRef.current = null;
    };
  }, [selectedDogIds, startLocation]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <MapPin className="h-4 w-4 text-indigo-600" /> Mapa de la ruta beta
          </h3>
          <p className="text-[11px] text-slate-500">Origen, perros seleccionados y llegada a la UPB</p>
        </div>
        {!loaded && <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />}
      </div>
      <div ref={containerRef} className="h-[310px] w-full" />
    </div>
  );
}

declare global {
  interface Window {
    L?: {
      map: (element: HTMLElement, options: { scrollWheelZoom: boolean }) => {
        setView: (center: [number, number], zoom: number) => unknown;
        remove: () => void;
      };
      tileLayer: (url: string, options: { attribution: string; maxZoom: number }) => { addTo: (map: unknown) => unknown };
      polyline: (points: [number, number][], options: { color: string; weight: number; opacity: number; dashArray: string }) => { addTo: (map: unknown) => unknown };
      marker: (point: [number, number], options: { icon: unknown }) => { addTo: (map: unknown) => unknown };
      divIcon: (options: { className: string; html: string; iconSize: [number, number]; iconAnchor: [number, number] }) => unknown;
    };
  }
}
