// Geolocation & Nearest NABL Lab Matching Engine for LabSetu
import { supabase } from '../lib/supabase';

export const DEFAULT_ACCREDITED_LABS = [
  {
    id: 'lab-central',
    name: 'LabSetu Central Reference Lab',
    accreditation: 'NABL & ICMR Accredited (ISO 15189)',
    nabl: true,
    latitude: 28.4595,
    longitude: 77.0266,
    address: 'Sector 14 Healthcare Hub, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    supported_tests: ['cbc', 'lipid', 'thyroid', 'sugar', 'lft', 'kft', 'hba1c'],
    rating: 4.9,
    review_count: '1,420',
    home_pickup: true
  },
  {
    id: 'lab-maxpath',
    name: 'MaxPath Precision Laboratories',
    accreditation: 'NABL Certified & CAP Accredited',
    nabl: true,
    latitude: 28.4721,
    longitude: 77.0428,
    address: 'MG Road Medical Arcade, Gurugram',
    city: 'Gurugram',
    state: 'Haryana',
    supported_tests: ['cbc', 'lipid', 'sugar', 'thyroid', 'vitd', 'b12'],
    rating: 4.8,
    review_count: '890',
    home_pickup: true
  },
  {
    id: 'lab-apex',
    name: 'Apex Clinical Diagnostics',
    accreditation: 'NABL Accredited Category A',
    nabl: true,
    latitude: 28.5355,
    longitude: 77.3910,
    address: 'Sector 62 Institutional Area, Noida',
    city: 'Noida',
    state: 'Uttar Pradesh',
    supported_tests: ['cbc', 'lipid', 'thyroid', 'sugar', 'rtpcr'],
    rating: 4.7,
    review_count: '740',
    home_pickup: true
  },
  {
    id: 'lab-delhi-south',
    name: 'Metropolis South Reference Lab',
    accreditation: 'NABL & CAP Gold Standard',
    nabl: true,
    latitude: 28.5244,
    longitude: 77.2066,
    address: 'Hauz Khas Enclave, New Delhi',
    city: 'New Delhi',
    state: 'Delhi',
    supported_tests: ['cbc', 'lipid', 'thyroid', 'sugar', 'hormones'],
    rating: 4.9,
    review_count: '2,150',
    home_pickup: true
  }
];

/**
 * Computes the great-circle distance between two GPS coordinates in kilometers
 * using the Haversine formula.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;

  return Math.round(dist * 10) / 10; // Round to 1 decimal place (e.g. 1.2 km)
}

/**
 * Resolves current user coordinates via browser navigator.geolocation
 * with automatic fallback to regional coordinates.
 */
export function getCurrentCoordinates() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({ latitude: 28.4610, longitude: 77.0280, isFallback: true });
      return;
    }

    const timer = setTimeout(() => {
      resolve({ latitude: 28.4610, longitude: 77.0280, isFallback: true });
    }, 4500);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          isFallback: false
        });
      },
      (err) => {
        clearTimeout(timer);
        console.warn('Geolocation lookup notice (using regional center):', err.message);
        resolve({ latitude: 28.4610, longitude: 77.0280, isFallback: true });
      },
      { timeout: 4000, enableHighAccuracy: true }
    );
  });
}

/**
 * Matches closest NABL-accredited lab based on user coordinates.
 * Queries Supabase `labs` table first, falls back to pre-seeded catalog.
 */
export async function matchNearestNablLab(userCoords, testType = null) {
  let labsList = DEFAULT_ACCREDITED_LABS;

  try {
    const { data, error } = await supabase
      .from('labs')
      .select('*')
      .eq('nabl', true);

    if (!error && Array.isArray(data) && data.length > 0) {
      labsList = data;
    }
  } catch (err) {
    console.warn('Fallback to local accredited lab catalog:', err);
  }

  const userLat = userCoords?.latitude ?? 28.4610;
  const userLng = userCoords?.longitude ?? 77.0280;

  // Filter accredited labs and calculate distance
  const evaluatedLabs = labsList
    .filter((lab) => lab.nabl !== false)
    .map((lab) => {
      const distance = calculateHaversineDistance(
        userLat,
        userLng,
        Number(lab.latitude),
        Number(lab.longitude)
      );
      return {
        ...lab,
        distanceKm: distance,
        distanceText: `${distance} km away`
      };
    })
    .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));

  const nearestLab = evaluatedLabs[0] || DEFAULT_ACCREDITED_LABS[0];

  return {
    nearestLab,
    distanceKm: nearestLab.distanceKm || 1.2,
    allLabs: evaluatedLabs,
    userCoords: { latitude: userLat, longitude: userLng }
  };
}
