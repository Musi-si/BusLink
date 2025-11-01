// src/utils/etaCalculator.ts

import { Stop } from '@prisma/client'; // Import the Stop type directly from Prisma

// --- Type Definitions for Clarity and Safety ---

export interface Location {
  lat: number;
  lng: number;
}

export interface BusLocation extends Location {
  speedKmh?: number | null;
  lastUpdated?: Date | string | null;
}

export interface EtaResult {
  distanceMeters: number;
  etaSeconds: number;
  etaMinutes: number;
  etaFormatted: string;
  effectiveSpeedKmh: number;
  trafficFactor: number;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated: string;
}

export interface StopWithDistance extends Stop {
  distanceMeters: number;
}

// --- Helper Functions ---

/**
 * Convert degrees to radians.
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculate distance between two points using Haversine formula.
 * @returns Distance in meters.
 */
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format ETA in seconds for display.
 * @returns Formatted ETA string (e.g., '55s', '12m', '1h 5m').
 */
export const formatETA = (etaSeconds: number): string => {
  if (etaSeconds < 60) {
    return `${Math.round(etaSeconds)}s`;
  }
  const minutes = Math.round(etaSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};


/**
 * Calculate a confidence score based on data quality.
 * @returns Confidence level: 'high', 'medium', or 'low'.
 */
const calculateETAConfidence = (busLocation: BusLocation, distance: number): 'high' | 'medium' | 'low' => {
  let confidence = 100;

  // Reduce confidence if speed is missing or very low
  if (!busLocation.speedKmh || busLocation.speedKmh < 5) {
    confidence -= 30;
  }

  // Reduce confidence for very long distances
  if (distance > 10000) { // > 10km
    confidence -= 25;
  }
  
  // Reduce confidence if location data is old
  if (busLocation.lastUpdated) {
    const now = new Date();
    const lastUpdate = new Date(busLocation.lastUpdated);
    const ageMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
    
    if (ageMinutes > 10) confidence -= 40;
    else if (ageMinutes > 5) confidence -= 20;
  } else {
    confidence -= 10; // Penalty for missing last update time
  }
  
  if (confidence >= 75) return 'high';
  if (confidence >= 45) return 'medium';
  return 'low';
};


// --- Core Exported Functions ---

/**
 * Find nearby stops to a given location within a maximum distance.
 * @returns An array of nearby stops, sorted by distance.
 */
export const findNearbyStops = (location: Location, stops: Stop[], maxDistanceMeters: number = 1000): StopWithDistance[] => {
  return stops
    .map(stop => ({
      ...stop,
      distanceMeters: calculateDistance(
        location.lat,
        location.lng,
        stop.latitude, // Prisma uses `number` for Float, no parseFloat needed
        stop.longitude
      ),
    }))
    .filter(stop => stop.distanceMeters <= maxDistanceMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
};

/**
 * Calculate real-time ETA for a bus to reach a single stop, considering traffic and other factors.
 */
export const calculateRealTimeETA = (busLocation: BusLocation, stop: Stop): EtaResult => {
  const now = new Date();
  const timeOfDay = now.getHours();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Dynamic traffic factor based on time and day
  let trafficFactor = 1.2; // Normal daytime traffic
  
  // Rush hour adjustments (7-9 AM and 5-7 PM)
  if ((timeOfDay >= 7 && timeOfDay < 10) || (timeOfDay >= 17 && timeOfDay < 20)) {
    trafficFactor = 1.6; // 60% longer
  } else if (timeOfDay >= 22 || timeOfDay <= 5) {
    trafficFactor = 0.9; // 10% faster during late night
  }
  
  // Weekend adjustment
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    trafficFactor *= 0.85; // 15% faster on weekends
  }
  
  // Use a default speed if current speed is unreliable
  const effectiveSpeedKmh = (busLocation.speedKmh && busLocation.speedKmh > 5) ? busLocation.speedKmh : 25; // Default urban bus speed: 25 km/h
  
  const distanceMeters = calculateDistance(busLocation.lat, busLocation.lng, stop.latitude, stop.longitude);
  
  const speedMps = effectiveSpeedKmh / 3.6; // Convert km/h to m/s
  const etaSeconds = (distanceMeters / speedMps) * trafficFactor;
  
  return {
    distanceMeters: Math.round(distanceMeters),
    etaSeconds: Math.round(etaSeconds),
    etaMinutes: Math.round(etaSeconds / 60),
    etaFormatted: formatETA(etaSeconds),
    effectiveSpeedKmh: Math.round(effectiveSpeedKmh),
    trafficFactor: Math.round(trafficFactor * 100) / 100,
    confidence: calculateETAConfidence(busLocation, distanceMeters),
    lastUpdated: now.toISOString(),
  };
};

/**
 * Calculate the sequential ETA for a bus along a series of upcoming stops on its route.
 */
export const calculateRouteETAs = (busLocation: BusLocation, upcomingStops: Stop[]) => {
  let cumulativeTimeSeconds = 0;
  let currentLocation: BusLocation = { ...busLocation };
  
  return upcomingStops.map((stop) => {
    const etaResult = calculateRealTimeETA(currentLocation, stop);
    
    // Add travel time to this stop
    cumulativeTimeSeconds += etaResult.etaSeconds;
    
    // Update current location for the next calculation
    currentLocation = {
      lat: stop.latitude,
      lng: stop.longitude,
      speedKmh: etaResult.effectiveSpeedKmh, // Use the effective speed for the next leg
    };
    
    const result = {
      stopId: stop.id,
      stopName: stop.name,
      etaSeconds: Math.round(cumulativeTimeSeconds),
      etaFormatted: formatETA(cumulativeTimeSeconds),
      arrivalTime: new Date(Date.now() + cumulativeTimeSeconds * 1000).toISOString(),
    };
    
    // Add an average "dwell time" for the bus at the stop for the next calculation
    cumulativeTimeSeconds += 30; // Assume 30 seconds wait time at each stop

    return result;
  });
};