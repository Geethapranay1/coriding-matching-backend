import { decode, overlapScore, haversine, discreteFrechetDistance, calculateSimilarity } from '../utils/polylineUtils';

type Coord = [number, number];

export interface Match {
  overlap: number;
  extraDist: number;
  score: number;
  valid: boolean;
  frechetDist?: number;
  similarity?: number;
  destMatch?: boolean;
  routeType?: string;
}


const MATCH_THRESHOLDS = {
  sameDest: { overlap: 15, extra: 40, score: 25 },
  sameOrigin: { overlap: 20, extra: 35, score: 30 },
  different: { overlap: 30, extra: 25, score: 40 }
};

const PICKUP_RADIUS = 5000;  // 5 km
const DEST_RADIUS = 2000;    // 2 km



const timeCompat = (t1: Date, t2: Date, windowMin: number = 45): number => {
  const diff = Math.abs(t1.getTime() - t2.getTime()) / (1000 * 60);
  return diff <= windowMin ? 100 - (diff / windowMin) * 30 : 0;
};

const checkDestinationMatch = (r1: Coord[], r2: Coord[]): boolean => {
  if (r1.length < 2 || r2.length < 2) return false;
  return haversine(r1[r1.length - 1], r2[r2.length - 1]) <= DEST_RADIUS;
};

const checkOriginMatch = (r1: Coord[], r2: Coord[]): boolean => {
  if (r1.length < 2 || r2.length < 2) return false;
  return haversine(r1[0], r2[0]) <= PICKUP_RADIUS;
};

const routeDeviationScore = (r1: Coord[], r2: Coord[]): number => {
  if (r1.length < 2 || r2.length < 2) return 0;

  const startDist = haversine(r1[0], r2[0]);
  const endDist = haversine(r1[r1.length - 1], r2[r2.length - 1]);

  const startScore = Math.max(0, 100 - (startDist / PICKUP_RADIUS) * 100);
  const endScore = Math.max(0, 100 - (endDist / DEST_RADIUS) * 100);

  return (startScore * 0.3 + endScore * 0.7);
};

const calcScore = (
  overlap: number,
  extraDistPenalty: number,
  devScore: number,
  frechetSim: number,
  destMatch: boolean,
  routeLength: number
): number => {
  if (destMatch) {
    // Same destination: weight pickup & efficiency higher
    const pickupWeight = 0.3;
    const routeWeight = 0.4;
    const distWeight = 0.2;
    const devWeight = 0.1;

    const distScore = Math.max(0, 100 - Math.min(extraDistPenalty * 1.5, 40));
    const lengthBonus = routeLength > 15000 ? 15 : (routeLength > 5000 ? 10 : 5);

    return (frechetSim * pickupWeight) +
           (overlap * routeWeight) +
           (distScore * distWeight) +
           (devScore * devWeight) +
           lengthBonus;
  } else {
    // General route matching
    const overlapWeight = 0.4;
    const distWeight = 0.25;
    const devWeight = 0.25;
    const frechetWeight = 0.1;

    const distScore = Math.max(0, 100 - Math.min(extraDistPenalty * 2, 50));

    return (overlap * overlapWeight) +
           (distScore * distWeight) +
           (devScore * devWeight) +
           (frechetSim * frechetWeight);
  }
};

const validateDifferentTrips = (r1: Coord[], r2: Coord[], dist1: number, dist2: number): boolean => {
  if (Math.abs(dist1 - dist2) < 100) {
    const startDist = haversine(r1[0], r2[0]);
    const endDist = haversine(r1[r1.length - 1], r2[r2.length - 1]);
    if (startDist < 50 && endDist < 50) {
      return false; // same trip
    }
  }
  return true;
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

  if (!validateDifferentTrips(r1, r2, newDist, candDist)) {
    return {
      overlap: 0,
      extraDist: 0,
      score: 0,
      valid: false,
      frechetDist: 0,
      similarity: 0,
      destMatch: false,
      routeType: 'self-match'
    };
  }

  const overlap = overlapScore(r1, r2);

  // only penalize if candidate route is longer
  const rawExtraDist = ((candDist - newDist) / Math.max(newDist, 1)) * 100;
  const extraDistPenalty = rawExtraDist > 0 ? rawExtraDist : 0;

  const devScore = routeDeviationScore(r1, r2);
  const frechetDist = discreteFrechetDistance(r1, r2);
  const frechetSim = calculateSimilarity(r1, r2);

  const destMatch = checkDestinationMatch(r1, r2);
  const originMatch = checkOriginMatch(r1, r2);

  let routeType = 'different';
  if (destMatch && originMatch) routeType = 'same-origin-dest';
  else if (destMatch) routeType = 'same-destination';
  else if (originMatch) routeType = 'same-origin';

  const avgDist = (newDist + candDist) / 2;
  let finalScore = calcScore(overlap, extraDistPenalty, devScore, frechetSim, destMatch, avgDist);

  if (newTime && candTime) {
    const timeScore = timeCompat(newTime, candTime);
    finalScore = (finalScore * 0.75) + (timeScore * 0.25);
  }

  // validation using config thresholds
  let valid = false;
  if (destMatch) {
    const t = MATCH_THRESHOLDS.sameDest;
    valid = (frechetSim >= t.overlap || overlap >= t.overlap) &&
            rawExtraDist <= t.extra &&
            finalScore >= t.score;
  } else if (originMatch) {
    const t = MATCH_THRESHOLDS.sameOrigin;
    valid = overlap >= t.overlap &&
            rawExtraDist <= t.extra &&
            finalScore >= t.score;
  } else {
    const t = MATCH_THRESHOLDS.different;
    valid = overlap >= t.overlap &&
            rawExtraDist <= t.extra &&
            finalScore >= t.score;
  }

  return {
    overlap: Number(overlap.toFixed(2)),
    extraDist: Number(rawExtraDist.toFixed(2)), // keep signed % for debugging
    score: Number(finalScore.toFixed(2)),
    valid,
    frechetDist: Number(frechetDist.toFixed(2)),
    similarity: Number(frechetSim.toFixed(2)),
    destMatch,
    routeType
  };
};


//sarjapur - {12.854922, 77.788116}
//airport - {13.199379, 77.710136}
//hsr layout - {12.9121, 77.6387}
//koramangala - {12.934533, 77.626579}
