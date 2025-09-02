"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateMatch = calculateMatch;
const polylineUtils_1 = require("../utils/polylineUtils");
function calculateDistanceScore(overlap, extraDist, directionalSim = 0) {
    const baseScore = overlap * 0.5;
    const distPenalty = Math.abs(extraDist) * 0.3;
    const directionBonus = directionalSim * 0.2; // Bonus for same direction routes
    const timeBonus = overlap > 70 ? 10 : 0;
    return Math.max(0, baseScore - distPenalty + directionBonus + timeBonus);
}
function getRouteCompatibility(p1, p2) {
    if (p1.length === 0 || p2.length === 0)
        return { score: 0, startProximity: 0, endProximity: 0 };
    // Calculate actual distances using haversine formula
    const startDist = (0, polylineUtils_1.haversineDistance)(p1[0], p2[0]);
    const endDist = (0, polylineUtils_1.haversineDistance)(p1[p1.length - 1], p2[p2.length - 1]);
    // Convert distances to proximity scores (closer = higher score)
    const startProximity = Math.max(0, 100 - (startDist / 1000) * 10); // 10 points per km
    const endProximity = Math.max(0, 100 - (endDist / 1000) * 10);
    const avgProximity = (startProximity + endProximity) / 2;
    return {
        score: avgProximity,
        startProximity: Math.round(startProximity * 100) / 100,
        endProximity: Math.round(endProximity * 100) / 100
    };
}
function calculateMatch(newPoly, candPoly, newDist, candDist) {
    const p1 = (0, polylineUtils_1.decodePolyline)(newPoly);
    const p2 = (0, polylineUtils_1.decodePolyline)(candPoly);
    // Use advanced geospatial analysis
    const advancedAnalysis = (0, polylineUtils_1.calculateAdvancedOverlap)(p1, p2, 150); // 150m buffer for urban areas
    const routeCompat = getRouteCompatibility(p1, p2);
    // Combine advanced overlap with route compatibility
    const overlap = Math.max(advancedAnalysis.overlapPercentage, routeCompat.score * 0.3 // Weight down pure proximity
    );
    const extraDist = ((candDist - newDist) / newDist) * 100;
    // Enhanced validity criteria using advanced metrics
    const valid = overlap >= 25 &&
        Math.abs(extraDist) <= 20 &&
        advancedAnalysis.directionalSimilarity >= 30; // Must have some directional similarity
    let score = 0;
    if (valid) {
        score = calculateDistanceScore(overlap, extraDist, advancedAnalysis.directionalSimilarity);
    }
    return {
        overlap: Math.round(overlap * 100) / 100,
        extraDist: Math.round(extraDist * 100) / 100,
        score: Math.round(score * 100) / 100,
        valid,
        details: {
            sharedDistance: Math.round(advancedAnalysis.sharedDistance),
            directionalSimilarity: Math.round(advancedAnalysis.directionalSimilarity * 100) / 100,
            routeDeviation: Math.round(advancedAnalysis.routeDeviation * 100) / 100,
            startProximity: routeCompat.startProximity,
            endProximity: routeCompat.endProximity
        }
    };
}
