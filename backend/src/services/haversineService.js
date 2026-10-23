/**
 * Haversine Great-Circle Distance Service
 *
 * Formula:
 *   a = sin²(Δφ/2) + cos(φ1) × cos(φ2) × sin²(Δλ/2)
 *   c = 2 × atan2(√a, √(1−a))
 *   distance = R × c
 *
 * Where:
 *   R = 6371 km (Earth mean radius)
 *   φ is latitude in radians
 *   λ is longitude in radians
 */

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

/**
 * Calculate distance between two coordinates in kilometers.
 *
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers (float rounded to 2 decimal places)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const numLat1 = Number(lat1);
  const numLon1 = Number(lon1);
  const numLat2 = Number(lat2);
  const numLon2 = Number(lon2);

  if (isNaN(numLat1) || isNaN(numLon1) || isNaN(numLat2) || isNaN(numLon2)) {
    throw new Error('Invalid coordinate inputs provided to Haversine calculation');
  }

  const dLat = toRadians(numLat2 - numLat1);
  const dLon = toRadians(numLon2 - numLon1);

  const radLat1 = toRadians(numLat1);
  const radLat2 = toRadians(numLat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceKm = EARTH_RADIUS_KM * c;

  return parseFloat(distanceKm.toFixed(2));
}

module.exports = {
  calculateDistance,
  EARTH_RADIUS_KM,
};
