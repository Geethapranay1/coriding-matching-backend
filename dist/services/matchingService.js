"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMatch = void 0;
const polylineUtils_1 = require("../utils/polylineUtils");
const timeCompat = (t1, t2, windowMin = 45) => {
    const diff = Math.abs(t1.getTime() - t2.getTime()) / (1000 * 60);
    return diff <= windowMin ? 100 - (diff / windowMin) * 30 : 0;
};
const checkDestinationMatch = (r1, r2) => {
    if (r1.length < 2 || r2.length < 2)
        return false;
    const endDist = (0, polylineUtils_1.haversine)(r1[r1.length - 1], r2[r2.length - 1]);
    return endDist <= 1000; // Same destination within 1km
};
const checkOriginMatch = (r1, r2) => {
    if (r1.length < 2 || r2.length < 2)
        return false;
    const startDist = (0, polylineUtils_1.haversine)(r1[0], r2[0]);
    return startDist <= 1000; // Same origin within 1km
};
const routeDeviationScore = (r1, r2) => {
    if (r1.length < 2 || r2.length < 2)
        return 0;
    const startDist = (0, polylineUtils_1.haversine)(r1[0], r2[0]);
    const endDist = (0, polylineUtils_1.haversine)(r1[r1.length - 1], r2[r2.length - 1]);
    // More lenient for pickup, stricter for destination
    const maxPickupDev = 5000; // 5km for pickup deviation
    const maxDestDev = 2000; // 2km for destination deviation
    const startScore = Math.max(0, 100 - (startDist / maxPickupDev) * 100);
    const endScore = Math.max(0, 100 - (endDist / maxDestDev) * 100);
    // Weight destination higher than pickup
    return (startScore * 0.3 + endScore * 0.7);
};
const calcScore = (overlap, extraDist, devScore, frechetSim, destMatch, routeLength) => {
    // Different scoring for different route types
    if (destMatch) {
        // Same destination - more weight on pickup proximity and route efficiency
        const pickupWeight = 0.3;
        const routeWeight = 0.4;
        const distWeight = 0.2;
        const timeWeight = 0.1;
        const distPenalty = Math.min(Math.abs(extraDist) * 1.5, 40); // More lenient
        const distScore = Math.max(0, 100 - distPenalty);
        // Bonus for longer routes (more savings)
        const lengthBonus = routeLength > 15000 ? 15 : (routeLength > 5000 ? 10 : 5);
        return (frechetSim * pickupWeight) + (overlap * routeWeight) + (distScore * distWeight) +
            (devScore * timeWeight) + lengthBonus;
    }
    else {
        // General route matching
        const overlapWeight = 0.4;
        const distWeight = 0.25;
        const devWeight = 0.25;
        const frechetWeight = 0.1;
        const distPenalty = Math.min(Math.abs(extraDist) * 2, 50);
        const distScore = Math.max(0, 100 - distPenalty);
        return (overlap * overlapWeight) + (distScore * distWeight) + (devScore * devWeight) + (frechetSim * frechetWeight);
    }
};
// Validation to prevent self-matching
const validateDifferentTrips = (r1, r2, dist1, dist2) => {
    // Check if routes are identical (same trip)
    if (Math.abs(dist1 - dist2) < 100) { // Less than 100m difference
        const startDist = (0, polylineUtils_1.haversine)(r1[0], r2[0]);
        const endDist = (0, polylineUtils_1.haversine)(r1[r1.length - 1], r2[r2.length - 1]);
        // If both start and end are very close, likely same trip
        if (startDist < 50 && endDist < 50) {
            return false;
        }
    }
    return true;
};
const calculateMatch = (newPoly, candPoly, newDist, candDist, newTime, candTime) => {
    const r1 = (0, polylineUtils_1.decode)(newPoly);
    const r2 = (0, polylineUtils_1.decode)(candPoly);
    // Validation: prevent self-matching
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
    const overlap = (0, polylineUtils_1.overlapScore)(r1, r2);
    const extraDist = ((candDist - newDist) / newDist) * 100;
    const devScore = routeDeviationScore(r1, r2);
    const frechetDist = (0, polylineUtils_1.discreteFrechetDistance)(r1, r2);
    const frechetSim = (0, polylineUtils_1.calculateSimilarity)(r1, r2);
    // Check route characteristics
    const destMatch = checkDestinationMatch(r1, r2);
    const originMatch = checkOriginMatch(r1, r2);
    let routeType = 'different';
    if (destMatch && originMatch)
        routeType = 'similar';
    else if (destMatch)
        routeType = 'same-destination';
    else if (originMatch)
        routeType = 'same-origin';
    const avgDist = (newDist + candDist) / 2;
    let finalScore = calcScore(overlap, extraDist, devScore, frechetSim, destMatch, avgDist);
    if (newTime && candTime) {
        const timeScore = timeCompat(newTime, candTime);
        finalScore = (finalScore * 0.85) + (timeScore * 0.15);
    }
    // More lenient validation rules
    let valid = false;
    if (destMatch) {
        // Same destination: lower thresholds
        valid = (frechetSim >= 15 || overlap >= 15) && Math.abs(extraDist) <= 40 && finalScore >= 25;
    }
    else if (originMatch) {
        // Same origin: moderate thresholds
        valid = overlap >= 20 && Math.abs(extraDist) <= 35 && finalScore >= 30;
    }
    else {
        // Different routes: higher thresholds
        valid = overlap >= 30 && Math.abs(extraDist) <= 25 && finalScore >= 40;
    }
    return {
        overlap: Number(overlap.toFixed(2)),
        extraDist: Number(extraDist.toFixed(2)),
        score: Number(finalScore.toFixed(2)),
        valid,
        frechetDist: Number(frechetDist.toFixed(2)),
        similarity: Number(frechetSim.toFixed(2)),
        destMatch,
        routeType
    };
};
exports.calculateMatch = calculateMatch;
