import { LatLng } from './unipaseoTypes';

/**
 * Calculates haversine distance between two points in km
 */
export function getHaversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generates street-like path points between two waypoints for realistic fallback rendering.
 * It simulates a right-angle street grid (Manhattan routing) between Montería blocks.
 */
export function generateStreetGridPath(p1: LatLng, p2: LatLng): LatLng[] {
  const points: LatLng[] = [p1];
  const midLat = p1.lat;
  const midLng = p2.lng;
  points.push({ lat: midLat, lng: midLng });
  points.push(p2);
  return points;
}

interface RoutingResult {
  distanceKm: number;
  coordinates: LatLng[];
  durationMinutes: number;
}

/**
 * Fetches optimized walking/driving route from Project OSRM API, with an automatic
 * robust grid-routing fallback in case of rate limits or service interruptions.
 */
export async function fetchRoute(
  p1: LatLng,
  p2: LatLng,
  mode: 'walking' | 'driving' = 'walking',
  speedKmH: number = 4.5
): Promise<RoutingResult> {
  const profile = mode === 'walking' ? 'foot' : 'driving';
  const url = `https://router.project-osrm.org/route/v1/${profile}/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`OSRM API error: ${res.status}`);
    }

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found from OSRM');
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;

    if (route.geometry && route.geometry.coordinates) {
      const coordinates: LatLng[] = route.geometry.coordinates.map((c: [number, number]) => ({
        lat: c[1],
        lng: c[0],
      }));

      const calculatedDuration = (distanceKm / speedKmH) * 60;
      return {
        distanceKm,
        coordinates,
        durationMinutes: Math.max(1, Math.round(calculatedDuration)),
      };
    }

    throw new Error('No geometry in OSRM response');
  } catch {
    const straightDist = getHaversineDistance(p1, p2);
    const distanceKm = straightDist * 1.28;
    const durationMinutes = Math.max(1, Math.round((distanceKm / speedKmH) * 60));
    const coordinates = generateStreetGridPath(p1, p2);

    return {
      distanceKm,
      coordinates,
      durationMinutes,
    };
  }
}
