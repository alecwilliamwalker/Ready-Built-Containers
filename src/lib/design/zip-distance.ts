/**
 * ZIP Code Distance Calculator
 * 
 * Uses Haversine formula to calculate distance between ZIP codes.
 * ZIP code centroid data loaded from USPS database (42,522 ZIP codes).
 * 
 * To update ZIP data:
 * 1. Place updated CSV as zip_code_database.csv in project root
 * 2. Run: node scripts/convert-zip-csv-to-json.js
 */

import { ZIP_DATA } from "./zip-data";

// Shop location: Audubon, Iowa
export const AUDUBON_IA = {
  zip: "50025",
  lat: 41.7183,
  lng: -94.9322,
  city: "Audubon",
  state: "IA",
};

// Type for ZIP code centroid data
export type ZipCentroid = {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  county?: string;
};

/**
 * ZIP Code Centroid Database
 * Loaded from generated zip-data.ts (42,522 ZIP codes from USPS data)
 */
export const ZIP_CENTROIDS: Record<string, ZipCentroid> = ZIP_DATA;

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns Distance in miles
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Look up coordinates for a ZIP code
 * @returns Centroid data or null if not found
 */
export function getZipCoordinates(zip: string): ZipCentroid | null {
  // Normalize ZIP to 5 digits
  const normalizedZip = zip.trim().substring(0, 5);
  return ZIP_CENTROIDS[normalizedZip] || null;
}

/**
 * Calculate distance from Audubon, IA to a destination ZIP code
 * @returns Distance in miles, or null if ZIP not found
 */
export function getDistanceFromAudubon(destinationZip: string): number | null {
  const destination = getZipCoordinates(destinationZip);
  
  if (!destination) {
    return null;
  }
  
  return Math.round(
    haversineDistance(
      AUDUBON_IA.lat,
      AUDUBON_IA.lng,
      destination.lat,
      destination.lng
    )
  );
}

/**
 * Calculate delivery cost based on distance
 * @param distanceMiles Distance in miles
 * @param ratePerMile Rate in cents per mile (default $4.50)
 * @param minimumCents Minimum charge in cents (default $500)
 * @returns Delivery cost in cents
 */
export function calculateDeliveryCost(
  distanceMiles: number,
  ratePerMile: number = 450,
  minimumCents: number = 50000
): number {
  const calculated = distanceMiles * ratePerMile;
  return Math.max(calculated, minimumCents);
}

/**
 * Get city/state label for a ZIP code
 */
export function getZipLabel(zip: string): string | null {
  const data = getZipCoordinates(zip);
  if (!data || !data.city) {
    return null;
  }
  return `${data.city}, ${data.state}`;
}

/**
 * Get full location info for a ZIP code (city, county, state)
 */
export function getZipLocationInfo(zip: string): { city?: string; county?: string; state?: string } | null {
  const data = getZipCoordinates(zip);
  if (!data) {
    return null;
  }
  return {
    city: data.city,
    county: data.county,
    state: data.state,
  };
}

/**
 * Validate if a ZIP code exists in our database
 */
export function isValidZip(zip: string): boolean {
  return getZipCoordinates(zip) !== null;
}

