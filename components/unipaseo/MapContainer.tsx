'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng, SimulationFrame } from '@/lib/unipaseoTypes';

interface MapContainerProps {
  locations: Record<string, any>;
  startLocationId: 'casa' | 'centro' | 'abuela';
  activeDogs: string[];
  routePaths: { [key: string]: LatLng[] };
  onLocationDrag: (key: string, newLatLng: LatLng) => void;
  simulationPlaying: boolean;
  simulationFrame: SimulationFrame | null;
}

export default function MapContainer({
  locations,
  startLocationId,
  activeDogs,
  routePaths,
  onLocationDrag,
  simulationPlaying,
  simulationFrame,
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const polylinesRef = useRef<{ [key: string]: L.Polyline }>({});
  const simMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use Montería central coordinates as default zoom level
    const initialCenter: [number, number] = [8.766, -75.865];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 14,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update/render markers when locations, startLocation, activeDogs, or simulation state changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Helper to get styled div icon for high aesthetic quality
    const createCustomIcon = (
      label: string,
      bgColor: string,
      shadowColor: string,
      isActive: boolean = true
    ) => {
      const opacityClass = isActive ? 'opacity-100' : 'opacity-30 pointer-events-none';
      return L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div class="relative group transition-all duration-300 ${opacityClass}">
            <div 
              style="background-color: ${bgColor}; box-shadow: 0 4px 10px ${shadowColor};" 
              class="w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-bold border-2 border-white cursor-grab active:cursor-grabbing hover:scale-110 active:scale-95 transition-all"
            >
              <span class="drop-shadow-sm select-none">${label}</span>
            </div>
            <div class="absolute bottom-11 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-medium">
              Arrastra para re-calcular ⚙️
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
    };

    // Keep track of which markers are active in the current state
    const currentActiveKeys = new Set<string>();

    // 1. Home Base Marker (depends on starting location id)
    currentActiveKeys.add(startLocationId);
    if (!markersRef.current[startLocationId]) {
      const position = locations[startLocationId] || locations.casa || locations.abuela;
      const m = L.marker([position.lat, position.lng], {
        icon: createCustomIcon('🏠', '#10b981', 'rgba(16,185,129,0.4)'),
        draggable: !simulationPlaying,
      }).addTo(map);

      m.on('dragend', (e) => {
        const target = e.target as L.Marker;
        const latlng = target.getLatLng();
        onLocationDrag(startLocationId, { lat: latlng.lat, lng: latlng.lng });
      });

      markersRef.current[startLocationId] = m;
    } else {
      const position = locations[startLocationId];
      markersRef.current[startLocationId].setLatLng([position.lat, position.lng]);
      if (simulationPlaying) {
        markersRef.current[startLocationId].dragging?.disable();
      } else {
        markersRef.current[startLocationId].dragging?.enable();
      }
    }

    // Hide the other starting location
    ['casa', 'centro', 'abuela'].filter((id) => id !== startLocationId).forEach((inactiveId) => {
      if (markersRef.current[inactiveId]) {
        map.removeLayer(markersRef.current[inactiveId]);
        delete markersRef.current[inactiveId];
      }
    });

    // 2. Dog Pick & Drop Markers
    const dogList: ('S' | 'F' | 'M')[] = ['S', 'F', 'M'];
    dogList.forEach((dogId) => {
      const dog = locations[dogId];
      const isDogActive = activeDogs.includes(dogId);
      currentActiveKeys.add(dogId);

      if (!markersRef.current[dogId]) {
        const m = L.marker([dog.lat, dog.lng], {
          icon: createCustomIcon(dog.emoji, dog.color, `${dog.color}66`, isDogActive),
          draggable: isDogActive && !simulationPlaying,
        }).addTo(map);

        m.on('dragend', (e) => {
          const target = e.target as L.Marker;
          const latlng = target.getLatLng();
          onLocationDrag(dogId, { lat: latlng.lat, lng: latlng.lng });
        });

        markersRef.current[dogId] = m;
      } else {
        markersRef.current[dogId].setLatLng([dog.lat, dog.lng]);
        markersRef.current[dogId].setIcon(
          createCustomIcon(dog.emoji, dog.color, `${dog.color}66`, isDogActive)
        );
        if (isDogActive && !simulationPlaying) {
          markersRef.current[dogId].dragging?.enable();
        } else {
          markersRef.current[dogId].dragging?.disable();
        }
      }
    });

    // 3. Bus stop Marker
    currentActiveKeys.add('cra14');
    if (!markersRef.current['cra14']) {
      const position = locations['cra14'];
      const m = L.marker([position.lat, position.lng], {
        icon: createCustomIcon('🚌', '#06b6d4', 'rgba(6,182,212,0.4)'),
        draggable: !simulationPlaying,
      }).addTo(map);

      m.on('dragend', (e) => {
        const target = e.target as L.Marker;
        const latlng = target.getLatLng();
        onLocationDrag('cra14', { lat: latlng.lat, lng: latlng.lng });
      });

      markersRef.current['cra14'] = m;
    } else {
      const position = locations['cra14'];
      markersRef.current['cra14'].setLatLng([position.lat, position.lng]);
      if (simulationPlaying) {
        markersRef.current['cra14'].dragging?.disable();
      } else {
        markersRef.current['cra14'].dragging?.enable();
      }
    }

    // 4. UPB Marker
    currentActiveKeys.add('upb');
    if (!markersRef.current['upb']) {
      const position = locations['upb'];
      const m = L.marker([position.lat, position.lng], {
        icon: createCustomIcon('🎓', '#ef4444', 'rgba(239,68,68,0.4)'),
        draggable: !simulationPlaying,
      }).addTo(map);

      m.on('dragend', (e) => {
        const target = e.target as L.Marker;
        const latlng = target.getLatLng();
        onLocationDrag('upb', { lat: latlng.lat, lng: latlng.lng });
      });

      markersRef.current['upb'] = m;
    } else {
      const position = locations['upb'];
      markersRef.current['upb'].setLatLng([position.lat, position.lng]);
      if (simulationPlaying) {
        markersRef.current['upb'].dragging?.disable();
      } else {
        markersRef.current['upb'].dragging?.enable();
      }
    }
  }, [locations, startLocationId, activeDogs, simulationPlaying, onLocationDrag]);

  // Handle Route Path rendering (Polylines)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing polylines that are no longer in routePaths
    Object.keys(polylinesRef.current).forEach((key) => {
      if (!routePaths[key] || routePaths[key].length === 0) {
        polylinesRef.current[key].remove();
        delete polylinesRef.current[key];
      }
    });

    // Draw / update each route line
    Object.keys(routePaths).forEach((key) => {
      const coords = routePaths[key];
      if (!coords || coords.length === 0) return;

      const latLngs = coords.map((c) => L.latLng(c.lat, c.lng));

      let color = '#3b82f6';
      let dashArray = '';
      let weight = 5;

      if (key === 'C_P1') {
        color = '#10b981';
      } else if (key === 'Bus_UPB') {
        color = '#06b6d4';
        dashArray = '4, 10';
        weight = 6;
      } else if (key === 'P1_Bus' || key === 'P3_Bus') {
        color = '#64748b';
        dashArray = '5, 5';
      } else if (key.includes('P1_P2') || key.includes('P2_P3') || key.includes('P3_P1')) {
        color = '#8b5cf6';
      }

      if (!polylinesRef.current[key]) {
        const poly = L.polyline(latLngs, {
          color,
          weight,
          opacity: 0.82,
          dashArray,
          lineJoin: 'round',
        }).addTo(map);

        polylinesRef.current[key] = poly;
      } else {
        polylinesRef.current[key].setLatLngs(latLngs);
        polylinesRef.current[key].setStyle({ color, dashArray, weight });
      }
    });
  }, [routePaths]);

  // Handle live simulation moving marker & auto-panning
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!simulationPlaying || !simulationFrame) {
      if (simMarkerRef.current) {
        simMarkerRef.current.remove();
        simMarkerRef.current = null;
      }
      return;
    }

    const { lat, lng, emoji, message } = simulationFrame;

    if (!simMarkerRef.current) {
      const customSimIcon = L.divIcon({
        className: 'sim-moving-avatar',
        html: `
          <div class="relative flex flex-col items-center">
            <div class="bg-white/95 px-2.5 py-1.5 rounded-full shadow-2xl border-4 border-indigo-600 flex items-center justify-center gap-1.5 animate-bounce-subtle transform -translate-y-2">
              <span class="text-xl drop-shadow-sm">${emoji}</span>
              <div class="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-4 border-r-4 border-indigo-600 rotate-45"></div>
            </div>
          </div>
        `,
        iconSize: [120, 60],
        iconAnchor: [60, 50],
      });

      const m = L.marker([lat, lng], {
        icon: customSimIcon,
        zIndexOffset: 2000,
      }).addTo(map);

      simMarkerRef.current = m;
      map.setView([lat, lng], 15.5, { animate: true, duration: 1.5 });
    } else {
      simMarkerRef.current.setLatLng([lat, lng]);
      simMarkerRef.current.setIcon(
        L.divIcon({
          className: 'sim-moving-avatar',
          html: `
            <div class="relative flex flex-col items-center select-none">
              <div class="bg-white/95 px-3 py-1.5 rounded-xl shadow-2xl border-2 border-indigo-600 flex items-center justify-center gap-2 transform -translate-y-4">
                <span class="text-2xl drop-shadow-sm select-none">${emoji}</span>
                <span class="text-[10px] max-w-[80px] font-bold text-slate-800 leading-tight bg-slate-100 px-1 py-0.5 rounded truncate select-none">${message}</span>
                <div class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b-2 border-r-2 border-indigo-600 rotate-45"></div>
              </div>
            </div>
          `,
          iconSize: [200, 70],
          iconAnchor: [100, 55],
        })
      );

      map.panTo([lat, lng], { animate: true, duration: 0.6 });
    }
  }, [simulationPlaying, simulationFrame]);

  return (
    <div className="w-full h-full relative" id="map-parent">
      <div ref={mapContainerRef} className="w-full h-full z-10" id="map" />
      
      {!simulationPlaying && (
        <div className="absolute top-4 right-4 z-20 bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200 dark:border-slate-700 text-[11px] px-3 py-1.5 rounded-full font-semibold text-slate-600 dark:text-slate-300 pointer-events-none flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-ping"></span>
          💡 Puedes arrastrar las marcas del mapa para ajustar tus calles
        </div>
      )}
    </div>
  );
}
