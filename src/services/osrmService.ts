import axios from 'axios';
import { getCache, setCache } from '../db/redisClient';

export interface RouteData {
  polyline: string;
  distance: number;
  duration: number;
}

export const getRoute = async (
  pLat: number,
  pLng: number,
  dLat: number,
  dLng: number
): Promise<RouteData> => {
  const key = `rt:${pLat},${pLng}-${dLat},${dLng}`;

  const cached = await getCache<RouteData>(key);
  if (cached) return cached;

  const url = `${process.env.OSRM_URL}/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=polyline`;

  const resp = await axios.get(url);
  const data = resp.data as {
    code: string;
    message?: string;
    routes: Array<{
      geometry: string;
      distance: number;
      duration: number;
    }>;
  };

  if (data.code !== 'Ok') throw new Error('route failed: ' + (data.message ?? 'unknown'));

  const route = data.routes[0];
  const result: RouteData = {
    polyline: route.geometry,
    distance: route.distance,
    duration: route.duration,
  };

  await setCache(key, result, 3600);
  return result;

};

  
