import { decode, overlapScore, haversine, discreteFrechetDistance, calculateSimilarity } from '../utils/polylineUtils';

type Coord = [number, number];

export interface Match {
  overlap: number;
  extraDist: number;
  score: number;
  valid: boolean;
  frechetDist?: number;
  similarity?: number;
}

const timeCompat = (t1: Date, t2: Date, windowMin: number = 30): number => {
  const diff = Math.abs(t1.getTime() - t2.getTime()) / (1000 * 60);
  return diff <= windowMin ? 100 - (diff / windowMin) * 50 : 0;
};

const routeDeviationScore = (r1: Coord[], r2: Coord[]): number => {
  if (r1.length < 2 || r2.length < 2) return 0;
  
  const startDist = haversine(r1[0], r2[0]);
  const endDist = haversine(r1[r1.length-1], r2[r2.length-1]);
  
  const maxDev = 2000;
  const startScore = Math.max(0, 100 - (startDist / maxDev) * 100);
  const endScore = Math.max(0, 100 - (endDist / maxDev) * 100);
  
  return (startScore + endScore) / 2;
};

const calcScore = (overlap: number, extraDist: number, devScore: number, frechetSim: number): number => {
  const overlapWeight = 0.4;
  const distWeight = 0.2;
  const devWeight = 0.2;
  const frechetWeight = 0.2;
  
  const distPenalty = Math.min(Math.abs(extraDist) * 2, 50);
  const distScore = Math.max(0, 100 - distPenalty);
  
  return (overlap * overlapWeight) + (distScore * distWeight) + (devScore * devWeight) + (frechetSim * frechetWeight);
};

export const calculateMatch = (
  newPoly: string,
  candPoly: string,
  newDist: number,
  candDist: number,
  newTime?: Date,
  candTime?: Date
): Match => {
  const r1 = decode(newPoly);
  const r2 = decode(candPoly);

  const overlap = overlapScore(r1, r2);
  const extraDist = ((candDist - newDist) / newDist) * 100;
  const devScore = routeDeviationScore(r1, r2);
  
  const frechetDist = discreteFrechetDistance(r1, r2);
  const frechetSim = calculateSimilarity(r1, r2);
  
  let finalScore = calcScore(overlap, extraDist, devScore, frechetSim);
  
  if (newTime && candTime) {
    const timeScore = timeCompat(newTime, candTime);
    finalScore = (finalScore * 0.8) + (timeScore * 0.2);
  }
  
  const valid = overlap >= 25 && Math.abs(extraDist) <= 25 && finalScore >= 20;
  
  return {
    overlap: Number(overlap.toFixed(2)),
    extraDist: Number(extraDist.toFixed(2)),
    score: Number(finalScore.toFixed(2)),
    valid,
    frechetDist: Number(frechetDist.toFixed(2)),
    similarity: Number(frechetSim.toFixed(2))
  };
};
