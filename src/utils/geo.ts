const EARTH_RADIUS_M = 6_371_000;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Haversine distance between two points in meters. */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/** Initial bearing from point 1 to point 2 in degrees (0 = north, clockwise). */
export function computeBearing(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lng2 - lng1);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((toDeg(Math.atan2(y, x)) % 360) + 360) % 360;
}

/** Format distance with auto-scaling units. */
export function formatDistance(
  meters: number,
  imperial = false,
): { value: string; unit: string } {
  if (imperial) {
    const feet = meters * 3.28084;
    if (feet < 1000) return { value: Math.round(feet).toString(), unit: "ft" };
    const miles = feet / 5280;
    return { value: miles.toFixed(1), unit: "mi" };
  }
  if (meters < 1000) return { value: Math.round(meters).toString(), unit: "m" };
  return { value: (meters / 1000).toFixed(1), unit: "km" };
}
