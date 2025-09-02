"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodePolyline = decodePolyline;
exports.haversineDistance = haversineDistance;
exports.pointToLineDistance = pointToLineDistance;
exports.createLineSegments = createLineSegments;
exports.calculateRouteDistance = calculateRouteDistance;
exports.isPointNearRoute = isPointNearRoute;
exports.calculateAdvancedOverlap = calculateAdvancedOverlap;
exports.approximateOverlap = approximateOverlap;
const polyline_1 = __importDefault(require("@mapbox/polyline"));
function decodePolyline(poly) {
    return polyline_1.default.decode(poly).map(([lat, lng]) => ({ lat, lng }));
}
/**
 * Calculate haversine distance between two points in meters
 */
function haversineDistance(p1, p2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = toRadians(p2.lat - p1.lat);
    const dLng = toRadians(p2.lng - p1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(p1.lat)) * Math.cos(toRadians(p2.lat)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
/**
 * Calculate the shortest distance from a point to a line segment
 */
function pointToLineDistance(point, lineStart, lineEnd) {
    const A = point.lat - lineStart.lat;
    const B = point.lng - lineStart.lng;
    const C = lineEnd.lat - lineStart.lat;
    const D = lineEnd.lng - lineStart.lng;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    if (lenSq === 0) {
        return haversineDistance(point, lineStart);
    }
    let param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
        xx = lineStart.lat;
        yy = lineStart.lng;
    }
    else if (param > 1) {
        xx = lineEnd.lat;
        yy = lineEnd.lng;
    }
    else {
        xx = lineStart.lat + param * C;
        yy = lineStart.lng + param * D;
    }
    return haversineDistance(point, { lat: xx, lng: yy });
}
/**
 * Convert polyline points to line segments with distances
 */
function createLineSegments(points) {
    const segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const length = haversineDistance(start, end);
        segments.push({ start, end, length });
    }
    return segments;
}
/**
 * Calculate total distance of a route
 */
function calculateRouteDistance(points) {
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
        totalDistance += haversineDistance(points[i], points[i + 1]);
    }
    return totalDistance;
}
/**
 * Check if a point is within buffer distance of any segment in a route
 */
function isPointNearRoute(point, segments, bufferDistance) {
    return segments.some(segment => pointToLineDistance(point, segment.start, segment.end) <= bufferDistance);
}
/**
 * Calculate directional similarity between two route segments
 */
function calculateBearing(p1, p2) {
    const dLng = toRadians(p2.lng - p1.lng);
    const lat1 = toRadians(p1.lat);
    const lat2 = toRadians(p2.lat);
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    let bearing = Math.atan2(y, x);
    bearing = (bearing * 180 / Math.PI + 360) % 360;
    return bearing;
}
function bearingDifference(bearing1, bearing2) {
    let diff = Math.abs(bearing1 - bearing2);
    if (diff > 180) {
        diff = 360 - diff;
    }
    return diff;
}
/**
 * Advanced route overlap calculation using geospatial analysis
 */
function calculateAdvancedOverlap(routeA, routeB, bufferDistance = 100 // meters
) {
    if (routeA.length === 0 || routeB.length === 0) {
        return {
            overlapPercentage: 0,
            sharedDistance: 0,
            totalDistanceA: 0,
            totalDistanceB: 0,
            directionalSimilarity: 0,
            routeDeviation: 100
        };
    }
    const segmentsA = createLineSegments(routeA);
    const segmentsB = createLineSegments(routeB);
    const totalDistanceA = calculateRouteDistance(routeA);
    const totalDistanceB = calculateRouteDistance(routeB);
    let sharedDistanceA = 0;
    let sharedDistanceB = 0;
    let directionalScores = [];
    // Check each segment of route A against route B
    for (const segmentA of segmentsA) {
        const midPoint = {
            lat: (segmentA.start.lat + segmentA.end.lat) / 2,
            lng: (segmentA.start.lng + segmentA.end.lng) / 2
        };
        if (isPointNearRoute(midPoint, segmentsB, bufferDistance)) {
            sharedDistanceA += segmentA.length;
            // Find closest segment in route B for directional comparison
            let minDistance = Infinity;
            let closestSegmentB = null;
            for (const segmentB of segmentsB) {
                const distance = Math.min(pointToLineDistance(midPoint, segmentB.start, segmentB.end), pointToLineDistance(segmentB.start, segmentA.start, segmentA.end), pointToLineDistance(segmentB.end, segmentA.start, segmentA.end));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestSegmentB = segmentB;
                }
            }
            if (closestSegmentB && minDistance <= bufferDistance) {
                const bearingA = calculateBearing(segmentA.start, segmentA.end);
                const bearingB = calculateBearing(closestSegmentB.start, closestSegmentB.end);
                const bearingDiff = bearingDifference(bearingA, bearingB);
                // Convert bearing difference to similarity score (0-1)
                const directionSimilarity = Math.max(0, (180 - bearingDiff) / 180);
                directionalScores.push(directionSimilarity);
            }
        }
    }
    // Check each segment of route B against route A
    for (const segmentB of segmentsB) {
        const midPoint = {
            lat: (segmentB.start.lat + segmentB.end.lat) / 2,
            lng: (segmentB.start.lng + segmentB.end.lng) / 2
        };
        if (isPointNearRoute(midPoint, segmentsA, bufferDistance)) {
            sharedDistanceB += segmentB.length;
        }
    }
    // Calculate metrics
    const avgSharedDistance = (sharedDistanceA + sharedDistanceB) / 2;
    const avgTotalDistance = (totalDistanceA + totalDistanceB) / 2;
    const overlapPercentage = avgTotalDistance > 0 ? (avgSharedDistance / avgTotalDistance) * 100 : 0;
    const directionalSimilarity = directionalScores.length > 0
        ? directionalScores.reduce((sum, score) => sum + score, 0) / directionalScores.length
        : 0;
    // Route deviation calculation (how much longer is the combined route vs direct route)
    const startA = routeA[0];
    const endA = routeA[routeA.length - 1];
    const startB = routeB[0];
    const endB = routeB[routeB.length - 1];
    const directDistance = haversineDistance(startA, endA);
    const routeDeviation = directDistance > 0 ? ((totalDistanceA - directDistance) / directDistance) * 100 : 0;
    return {
        overlapPercentage: Math.min(100, Math.max(0, overlapPercentage)),
        sharedDistance: avgSharedDistance,
        totalDistanceA,
        totalDistanceB,
        directionalSimilarity: directionalSimilarity * 100,
        routeDeviation: Math.max(0, routeDeviation)
    };
}
/**
 * Backward compatibility function - uses advanced algorithm but returns simple percentage
 */
function approximateOverlap(polyA, polyB, bufferDistance = 100) {
    const analysis = calculateAdvancedOverlap(polyA, polyB, bufferDistance);
    // Combine overlap percentage with directional similarity for final score
    const baseScore = analysis.overlapPercentage;
    const directionBonus = analysis.directionalSimilarity * 0.3; // 30% weight for direction
    const deviationPenalty = Math.min(20, analysis.routeDeviation * 0.1); // Penalty for high deviation
    return Math.max(0, Math.min(100, baseScore + directionBonus - deviationPenalty));
}
