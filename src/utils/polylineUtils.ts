import polyline from '@mapbox/polyline';

type Coord = [number, number];

function haversine([lat1, lng1]: Coord, [lat2, lng2]: Coord): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function discreteFrechetDistance(
  P: Coord[],
  Q: Coord[]
): number {
  const n = P.length;
  const m = Q.length;
  const ca: number[][] = Array.from({ length: n }, () => Array(m).fill(-1));

  function c(i: number, j: number): number {
    if (ca[i][j] > -1) return ca[i][j];
    const d = haversine(P[i], Q[j]);
    if (i === 0 && j === 0) ca[i][j] = d;
    else if (i > 0 && j === 0) ca[i][j] = Math.max(c(i - 1, 0), d);
    else if (i === 0 && j > 0) ca[i][j] = Math.max(c(0, j - 1), d);
    else if (i > 0 && j > 0)
      ca[i][j] = Math.max(Math.min(c(i - 1, j), c(i - 1, j - 1), c(i, j - 1)), d);
    else
      ca[i][j] = Infinity;
    return ca[i][j];
  }
  return c(n - 1, m - 1);
}

export function decode(encoded: string): Coord[] {
  return polyline.decode(encoded);
}

export function encode(coords: Coord[]): string {
  return polyline.encode(coords);
}

export function routeDistance(route: Coord[]): number {
  let dist = 0;
  for (let i = 1; i < route.length; i++) {
    dist += haversine(route[i - 1], route[i]);
  }
  return dist;
}

export function resampleRoute(route: Coord[], interval: number = 100): Coord[] {
  if (route.length < 2) return route;
  
  const resampled: Coord[] = [route[0]];
  let currentDist = 0;
  let nextSample = interval;
  
  for (let i = 1; i < route.length; i++) {
    const segDist = haversine(route[i - 1], route[i]);
    
    while (nextSample <= currentDist + segDist) {
      const ratio = (nextSample - currentDist) / segDist;
      const lat = route[i - 1][0] + (route[i][0] - route[i - 1][0]) * ratio;
      const lng = route[i - 1][1] + (route[i][1] - route[i - 1][1]) * ratio;
      resampled.push([lat, lng]);
      nextSample += interval;
    }
    
    currentDist += segDist;
  }
  
  resampled.push(route[route.length - 1]);
  return resampled;
}

export function calculateSimilarity(routeA: Coord[], routeB: Coord[]): number {
  if (routeA.length < 2 || routeB.length < 2) return 0;
  
  // More generous resampling for longer routes
  const sampleInterval = Math.max(30, Math.min(100, Math.max(routeA.length, routeB.length) / 20));
  const resampledA = resampleRoute(routeA, sampleInterval);
  const resampledB = resampleRoute(routeB, sampleInterval);
  
  const frechetDist = discreteFrechetDistance(resampledA, resampledB);
  
  // Dynamic threshold based on route length
  const avgRouteLength = (routeDistance(routeA) + routeDistance(routeB)) / 2;
  const maxAcceptable = Math.max(1500, avgRouteLength * 0.15); // 15% of route length or 1.5km
  
  return Math.max(0, 100 - (frechetDist / maxAcceptable) * 100);
}

export function routeOverlap(routeA: Coord[], routeB: Coord[]): number {
  if (routeA.length < 2 || routeB.length < 2) return 0;
  
  const similarity = calculateSimilarity(routeA, routeB);
  const endpointSim = calculateEndpointSimilarity(routeA, routeB);
  
  // For same destination routes, weight similarity higher
  const destMatch = haversine(routeA[routeA.length-1], routeB[routeB.length-1]) <= 1000;
  
  if (destMatch) {
    return (similarity * 0.8 + endpointSim * 0.2);
  } else {
    return (similarity * 0.6 + endpointSim * 0.4);
  }
}

export function calculateEndpointSimilarity(routeA: Coord[], routeB: Coord[]): number {
  const startDist = haversine(routeA[0], routeB[0]);
  const endDist = haversine(routeA[routeA.length - 1], routeB[routeB.length - 1]);
  
  // More lenient for pickup, stricter for destination
  const maxPickupDist = 5000; // 5km
  const maxDestDist = 2000;   // 2km
  
  const startScore = Math.max(0, 100 - (startDist / maxPickupDist) * 100);
  const endScore = Math.max(0, 100 - (endDist / maxDestDist) * 100);
  
  // Weight destination higher
  return (startScore * 0.3 + endScore * 0.7);
}

export function overlapScore(routeA: Coord[], routeB: Coord[]): number {
  return routeOverlap(routeA, routeB);
}

export { haversine };
