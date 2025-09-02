import polyline from '@mapbox/polyline';

function haversine([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
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
  P: [number, number][],
  Q: [number, number][]
): number {
  const n = P.length;
  const m = Q.length;
  const ca: number[][] = Array.from({ length: n }, () => Array(m).fill(-1));

  function c(i: number, j: number): number {
    if (ca[i][j] > -1) return ca[i][j];
    let d = haversine(P[i], Q[j]);
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

export function decode(encoded: string): [number, number][] {
  return polyline.decode(encoded);
}

export function encode(coords: [number, number][]): string {
  return polyline.encode(coords);
}

export function routeDistance(route: [number, number][]): number {
  let dist = 0;
  for (let i = 1; i < route.length; i++) {
    dist += haversine(route[i - 1], route[i]);
  }
  return dist;
}

export function resampleRoute(route: [number, number][], interval: number = 100): [number, number][] {
  if (route.length < 2) return route;
  
  const resampled: [number, number][] = [route[0]];
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

export function calculateSimilarity(routeA: [number, number][], routeB: [number, number][]): number {
  if (routeA.length < 2 || routeB.length < 2) return 0;
  
  const resampledA = resampleRoute(routeA, 50);
  const resampledB = resampleRoute(routeB, 50);
  
  const frechetDist = discreteFrechetDistance(resampledA, resampledB);
  const maxAcceptable = 2000;
  
  return Math.max(0, 100 - (frechetDist / maxAcceptable) * 100);
}

export function routeOverlap(routeA: [number, number][], routeB: [number, number][]): number {
  if (routeA.length < 2 || routeB.length < 2) return 0;
  
  const similarity = calculateSimilarity(routeA, routeB);
  const endpointSim = calculateEndpointSimilarity(routeA, routeB);
  
  return (similarity * 0.7 + endpointSim * 0.3);
}

export function calculateEndpointSimilarity(routeA: [number, number][], routeB: [number, number][]): number {
  const startDist = haversine(routeA[0], routeB[0]);
  const endDist = haversine(routeA[routeA.length - 1], routeB[routeB.length - 1]);
  
  const maxDist = 3000;
  const startScore = Math.max(0, 100 - (startDist / maxDist) * 100);
  const endScore = Math.max(0, 100 - (endDist / maxDist) * 100);
  
  return (startScore + endScore) / 2;
}

export function overlapScore(routeA: [number, number][], routeB: [number, number][]): number {
  return routeOverlap(routeA, routeB);
}

export { haversine };
