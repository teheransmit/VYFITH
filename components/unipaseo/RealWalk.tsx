'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { RealWalkLog, LatLng } from '@/lib/unipaseoTypes';
import { Play, Square, Navigation, Footprints } from 'lucide-react';

interface RealWalkProps {
  onSaveWalk: (log: RealWalkLog) => void;
}

export default function RealWalk({ onSaveWalk }: RealWalkProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLog, setCurrentLog] = useState<RealWalkLog | null>(null);
  const [currentPos, setCurrentPos] = useState<LatLng | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const currentPosMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const eventMarkersRef = useRef<L.Marker[]>([]);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] = [8.7663, -75.8649];
    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 16,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Current Position Marker on map
  useEffect(() => {
    if (!mapRef.current || !currentPos) return;

    if (!currentPosMarkerRef.current) {
      const posIcon = L.divIcon({
        className: 'custom-realpos-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          background-color: #3b82f6;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.8);
          animation: pulse 1.5s infinite;
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      currentPosMarkerRef.current = L.marker([currentPos.lat, currentPos.lng], {
        icon: posIcon,
        zIndexOffset: 1000,
      }).addTo(mapRef.current);
    } else {
      currentPosMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
    }

    // Pan map smoothly to new position
    mapRef.current.panTo([currentPos.lat, currentPos.lng]);
  }, [currentPos]);

  // Update Polyline on map
  useEffect(() => {
    if (!mapRef.current) return;

    if (currentLog && currentLog.path.length > 1) {
      const latlngs: [number, number][] = currentLog.path.map((p) => [p.lat, p.lng]);
      if (!polylineRef.current) {
        polylineRef.current = L.polyline(latlngs, {
          color: '#4f46e5',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(mapRef.current);
      } else {
        polylineRef.current.setLatLngs(latlngs);
      }
    } else if (polylineRef.current && (!currentLog || currentLog.path.length <= 1)) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
  }, [currentLog]);

  // Update Event Markers on map
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous event markers
    eventMarkersRef.current.forEach((m) => m.remove());
    eventMarkersRef.current = [];

    if (!currentLog) return;

    currentLog.events.forEach((ev) => {
      const emoji =
        ev.type === 'start'
          ? '🟢'
          : ev.type === 'end'
          ? '🏁'
          : ev.type === 'pick_S'
          ? '🍊'
          : ev.type === 'pick_F'
          ? '🍇'
          : '🍌';

      const icon = L.divIcon({
        className: 'custom-event-marker',
        html: `<div style="
          background: white;
          border-radius: 50%;
          padding: 2px 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">${emoji}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([ev.lat, ev.lng], { icon }).addTo(mapRef.current!);
      eventMarkersRef.current.push(marker);
    });
  }, [currentLog?.events]);

  // Handle Geolocation Watcher
  useEffect(() => {
    let watchId: number;
    if (isTracking && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentPos(newPos);
          setGpsError(null);

          setCurrentLog((prev) => {
            if (!prev) return prev;
            const newPath = [...prev.path, newPos];
            let addedDist = 0;
            if (prev.path.length > 0) {
              const last = prev.path[prev.path.length - 1];
              addedDist = getDistance(last.lat, last.lng, newPos.lat, newPos.lng);
            }
            return {
              ...prev,
              path: newPath,
              totalDistanceKm: prev.totalDistanceKm + addedDist,
            };
          });
        },
        (error) => {
          console.warn('Geolocation watch error:', error.message);
          setGpsError('Permiso de GPS pendiente o señal baja. Usando punto simulado Montería.');
        },
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isTracking]);

  // Initial Position Probe
  useEffect(() => {
    if (!isTracking && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPos({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (err) => {
          console.log('Using default Montería coordinate', err);
          setCurrentPos({ lat: 8.7663, lng: -75.8649 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isTracking]);

  const startWalk = () => {
    setIsTracking(true);
    setGpsError(null);
    const now = Date.now();
    const pos = currentPos || { lat: 8.7663, lng: -75.8649 };
    setCurrentLog({
      id: `walk_${now}`,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      startTime: now,
      path: [pos],
      events: [
        {
          timeStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          timestamp: now,
          lat: pos.lat,
          lng: pos.lng,
          type: 'start',
        },
      ],
      totalDistanceKm: 0,
    });
  };

  const endWalk = () => {
    setIsTracking(false);
    if (currentLog) {
      const pos = currentPos || currentLog.path[currentLog.path.length - 1];
      const now = Date.now();
      const finalLog: RealWalkLog = {
        ...currentLog,
        endTime: now,
        events: [
          ...currentLog.events,
          {
            timeStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            timestamp: now,
            lat: pos.lat,
            lng: pos.lng,
            type: 'end' as const,
          },
        ],
      };
      onSaveWalk(finalLog);
      setCurrentLog(null);
    }
  };

  const registerEvent = (type: 'pick_S' | 'pick_F' | 'pick_M') => {
    if (!currentLog) return;
    const pos = currentPos || currentLog.path[currentLog.path.length - 1];
    const now = Date.now();
    setCurrentLog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: [
          ...prev.events,
          {
            timeStr: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            timestamp: now,
            lat: pos.lat,
            lng: pos.lng,
            type,
          },
        ],
      };
    });
  };

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-100">
      {/* Map Element */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px] z-10" />

      {/* Floating Control Card */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-slate-200">
        <div className="text-center mb-3">
          <div className="flex items-center justify-center gap-1.5 font-bold text-slate-800 text-sm">
            <Navigation className="w-4 h-4 text-indigo-600 animate-pulse" />
            <span>Modo Paseo Real (GPS en Vivo)</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {isTracking
              ? `Rastreando ruta... ${(currentLog?.totalDistanceKm || 0).toFixed(2)} km recorridos`
              : 'Listo para rastrear con el sensor GPS de tu móvil.'}
          </p>
          {gpsError && (
            <p className="text-[10px] text-amber-600 font-semibold mt-1 bg-amber-50 py-1 px-2 rounded-md">
              {gpsError}
            </p>
          )}
        </div>

        {isTracking ? (
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <button
                onClick={() => registerEvent('pick_S')}
                className="flex-1 bg-orange-100 hover:bg-orange-200 text-orange-800 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-orange-200 shadow-xs"
              >
                + Sienna 🍊
              </button>
              <button
                onClick={() => registerEvent('pick_F')}
                className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-800 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-purple-200 shadow-xs"
              >
                + Frida 🍇
              </button>
              <button
                onClick={() => registerEvent('pick_M')}
                className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-800 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-amber-200 shadow-xs"
              >
                + Molly 🍌
              </button>
            </div>
            <button
              onClick={endWalk}
              className="w-full bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Square className="w-4 h-4 fill-current" /> Terminar Paseo & Guardar
            </button>
          </div>
        ) : (
          <button
            onClick={startWalk}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md"
          >
            <Play className="w-4 h-4 fill-current" /> Iniciar Paseo GPS
          </button>
        )}
      </div>
    </div>
  );
}
