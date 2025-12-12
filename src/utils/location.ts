/**
 * Location utilities for calculating distances and managing GPS coordinates
 */

export interface Location {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: Location, coord2: Location): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * Get approximate location from coordinates (city name)
 * This is a simplified version - in production you'd use a geocoding service
 */
export function getLocationName(location: Location): string {
  // This is a placeholder - in a real app you'd use a geocoding service
  // For now, return coordinates as a rough location
  return `${location.lat.toFixed(2)}, ${location.lng.toFixed(2)}`;
}

/**
 * Check if two locations are within a certain distance
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @param maxDistance Maximum distance in kilometers
 * @returns True if within distance
 */
export function isWithinDistance(coord1: Location, coord2: Location, maxDistance: number): boolean {
  const distance = calculateDistance(coord1, coord2);
  return distance <= maxDistance;
}

/**
 * Get distance range for display (e.g., "5-10km")
 */
export function getDistanceRange(minDistance: number, maxDistance: number): string {
  if (minDistance === maxDistance) {
    return formatDistance(minDistance);
  }
  return `${formatDistance(minDistance)} - ${formatDistance(maxDistance)}`;
}

/**
 * Convert location object to PostGIS point format
 * Supabase/PostgreSQL expects: (longitude,latitude) with comma
 * @param location Location object with lat and lng
 * @returns PostGIS point string format: (lng,lat)
 */
export function locationToPoint(location: Location | null | undefined): string | null {
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    return null;
  }
  // PostgreSQL point format: (longitude,latitude) - note comma and parentheses
  return `(${location.lng},${location.lat})`;
}

/**
 * Convert PostGIS point string to Location object
 * Handles multiple formats: (lng,lat), POINT(lng lat), Point(lng,lat), etc.
 * @param point PostGIS point string (e.g., "(13.476373,59.534003)" or "POINT(13.476373 59.534003)")
 * @returns Location object or null
 */
export function pointToLocation(point: string | null | undefined): Location | null {
  if (!point || typeof point !== 'string') {
    return null;
  }
  
  // Try format: (lng,lat) - most common
  let match = point.match(/\(([\d.-]+),([\d.-]+)\)/);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2]),
    };
  }
  
  // Try format: POINT(lng lat) - WKT format
  match = point.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/i);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2]),
    };
  }
  
  // Try format: Point(lng,lat) or Point(lng lat)
  match = point.match(/Point\(([\d.-]+)[,\s]+([\d.-]+)\)/i);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2]),
    };
  }
  
  return null;
}