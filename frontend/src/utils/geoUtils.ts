/**
 * Geographic calculation utilities for SafaiSaathi routing and fleet tracking.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Great-Circle distance between two coordinates using the Haversine formula.
 * Returns distance in kilometers (rounded to 2 decimal places).
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100;
}

/**
 * Calculates total cumulative distance across a polyline array of coordinates.
 */
export function calculatePathDistance(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += calculateDistance(
      points[i][0],
      points[i][1],
      points[i + 1][0],
      points[i + 1][1]
    );
  }
  return Math.round(total * 100) / 100;
}

/**
 * Estimates driving travel time in minutes based on distance and average urban speed (28 km/h).
 * Adds a 5-minute service buffer per intermediate pickup.
 */
export function estimateTravelTime(
  distanceKm: number,
  stopsCount: number = 0,
  avgSpeedKmH: number = 28
): number {
  const transitTimeMinutes = (distanceKm / avgSpeedKmH) * 60;
  const serviceTimeMinutes = Math.max(0, stopsCount - 2) * 6; // 6 mins per waste stop
  return Math.round(transitTimeMinutes + serviceTimeMinutes);
}

/**
 * Linearly interpolates between two geo points by fraction (0.0 to 1.0).
 */
export function interpolateGeoPoint(
  p1: [number, number],
  p2: [number, number],
  fraction: number
): [number, number] {
  const f = Math.max(0, Math.min(1, fraction));
  const lat = p1[0] + (p2[0] - p1[0]) * f;
  const lng = p1[1] + (p2[1] - p1[1]) * f;
  return [Number(lat.toFixed(6)), Number(lng.toFixed(6))];
}

/**
 * Calculates bearing angle in degrees between two coordinates (0-360).
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const y = Math.sin(toRadians(lon2 - lon1)) * Math.cos(toRadians(lat2));
  const x =
    Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
    Math.sin(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.cos(toRadians(lon2 - lon1));
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

/**
 * Generates smooth intermediate waypoints between stop coordinates for realistic simulated navigation.
 */
export function generateSubdividedPath(
  waypoints: [number, number][],
  segmentsPerLeg: number = 10
): [number, number][] {
  if (waypoints.length < 2) return waypoints;
  const result: [number, number][] = [];

  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    for (let step = 0; step < segmentsPerLeg; step++) {
      const fraction = step / segmentsPerLeg;
      result.push(interpolateGeoPoint(start, end, fraction));
    }
  }
  result.push(waypoints[waypoints.length - 1]);
  return result;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function formatDurationMin(min: number): string {
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const remainingMin = min % 60;
  return remainingMin > 0 ? `${hours}h ${remainingMin}m` : `${hours}h`;
}
