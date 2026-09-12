/**
 * Geographic coordinates and mapping utilities for Corregimiento Ernesto Córdoba Campos
 * Used across the Citizen Public Portal and Admin ERP/CRM modules
 */

export const SECTOR_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Altos de Las Cumbres': { lat: 9.0834, lng: -79.5312 },
  'Nueva Libia': { lat: 9.0945, lng: -79.5241 },
  'Villa Zaita': { lat: 9.0712, lng: -79.5188 },
  'Gonzalillo': { lat: 9.0882, lng: -79.5153 },
  'Ciudad San Lorenzo': { lat: 9.0991, lng: -79.5388 },
  'Colinas del Rocío': { lat: 9.0776, lng: -79.5267 },
  'Las Praderas del Rocío': { lat: 9.0744, lng: -79.5291 },
  'Reparto Portofino': { lat: 9.0815, lng: -79.5219 },
  'Villa María': { lat: 9.0911, lng: -79.5304 },
  'Villa Milagros': { lat: 9.0858, lng: -79.5273 },
  'Milla 9': { lat: 9.0683, lng: -79.5142 },
  'Santa Rita': { lat: 9.0934, lng: -79.5192 },
};

export const DEFAULT_CORREGIMIENTO_CENTER: [number, number] = [9.0865, -79.5280];

export const ERNESTO_CORDOBA_CAMPOS_POLYGON: [number, number][] = [
  [9.0645, -79.5285],
  [9.0682, -79.5175],
  [9.0740, -79.5120],
  [9.0825, -79.5080],
  [9.0920, -79.5110],
  [9.0995, -79.5170],
  [9.1065, -79.5230],
  [9.1120, -79.5315],
  [9.1090, -79.5415],
  [9.0985, -79.5485],
  [9.0885, -79.5515],
  [9.0780, -79.5465],
  [9.0700, -79.5385],
  [9.0645, -79.5285],
];

/**
 * Get base center coordinates for a sector
 */
export function getSectorCoordinates(sectorName?: string): { lat: number; lng: number } {
  if (!sectorName) return { lat: DEFAULT_CORREGIMIENTO_CENTER[0], lng: DEFAULT_CORREGIMIENTO_CENTER[1] };
  const found = Object.entries(SECTOR_COORDINATES).find(
    ([sec]) => sec.toLowerCase() === sectorName.toLowerCase()
  );
  if (found) return found[1];
  return { lat: DEFAULT_CORREGIMIENTO_CENTER[0], lng: DEFAULT_CORREGIMIENTO_CENTER[1] };
}

/**
 * Deterministic pseudo-random offset based on string or number seed
 * Avoids pins stacking identically while ensuring they don't bounce on re-renders
 */
export function generateTicketCoordinates(
  sectorName: string,
  seed?: string | number
): { lat: number; lng: number } {
  const base = getSectorCoordinates(sectorName);
  if (!seed) return base;

  const str = String(seed);
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    hash1 = (hash1 << 5) - hash1 + str.charCodeAt(i);
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + str.charCodeAt(i);
    hash2 |= 0;
  }

  // Offset between -0.0025 and +0.0025 degrees (~250 meters within sector)
  const offsetLat = (((Math.abs(hash1) % 1000) - 500) / 500) * 0.0022;
  const offsetLng = (((Math.abs(hash2) % 1000) - 500) / 500) * 0.0022;

  return {
    lat: Number((base.lat + offsetLat).toFixed(6)),
    lng: Number((base.lng + offsetLng).toFixed(6)),
  };
}
