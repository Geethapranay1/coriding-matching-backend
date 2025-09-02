"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionMatchingWorker = void 0;
const matchingService_1 = require("./matchingService");
class ProductionMatchingWorker {
    constructor(db, redis = null, config = {}) {
        this.isProcessing = false;
        this.db = db;
        this.redis = redis;
        this.config = Object.assign({ maxConcurrentMatches: 50, cacheEnabled: true, advancedAlgorithm: true, matchingRadius: 50, maxRouteDeviation: 25, minOverlapThreshold: 20 }, config);
    }
    findMatches(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                // Get the target trip
                const targetTrip = yield this.db.trip.findUnique({
                    where: { id: Number(tripId) }
                });
                if (!targetTrip) {
                    throw new Error(`Trip ${tripId} not found`);
                }
                // Check cache first
                if (this.config.cacheEnabled && this.redis) {
                    const cacheKey = `matches:${tripId}:v2`;
                    const cached = yield this.redis.get(cacheKey);
                    if (cached) {
                        return JSON.parse(cached);
                    }
                }
                // Get candidate trips within reasonable geographic bounds
                const candidates = yield this.getCandidateTrips(targetTrip);
                // Process matches in batches
                const matches = yield this.processMatchesBatch(targetTrip, candidates);
                // Filter and sort results
                const validMatches = matches
                    .filter(match => match.valid && match.overlap >= this.config.minOverlapThreshold)
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 10); // Top 10 matches
                // Cache results
                if (this.config.cacheEnabled && this.redis) {
                    const cacheKey = `matches:${tripId}:v2`;
                    yield this.redis.setEx(cacheKey, 300, JSON.stringify(validMatches)); // 5min cache
                }
                console.log(`Found ${validMatches.length} matches for trip ${tripId} in ${Date.now() - startTime}ms`);
                return validMatches;
            }
            catch (error) {
                console.error('Error in findMatches:', error);
                throw error;
            }
        });
    }
    getCandidateTrips(targetTrip) {
        return __awaiter(this, void 0, void 0, function* () {
            // Calculate rough geographic bounds (±0.5 degrees ≈ 55km)
            const latRange = 0.5;
            const lngRange = 0.5;
            const minLat = targetTrip.pickupLat - latRange;
            const maxLat = targetTrip.pickupLat + latRange;
            const minLng = targetTrip.pickupLng - lngRange;
            const maxLng = targetTrip.pickupLng + lngRange;
            // Get time window (±30 minutes)
            const timeWindow = 30 * 60 * 1000; // 30 minutes in milliseconds
            const minTime = new Date(targetTrip.departureTime.getTime() - timeWindow);
            const maxTime = new Date(targetTrip.departureTime.getTime() + timeWindow);
            return yield this.db.trip.findMany({
                where: {
                    id: { not: Number(targetTrip.id) },
                    pickupLat: { gte: minLat, lte: maxLat },
                    pickupLng: { gte: minLng, lte: maxLng },
                    departureTime: { gte: minTime, lte: maxTime },
                    routePolyline: { not: "" },
                    routeDistance: { gt: 0 }
                },
                take: this.config.maxConcurrentMatches
            });
        });
    }
    processMatchesBatch(targetTrip, candidates) {
        return __awaiter(this, void 0, void 0, function* () {
            const batchSize = 10;
            const results = [];
            for (let i = 0; i < candidates.length; i += batchSize) {
                const batch = candidates.slice(i, i + batchSize);
                const batchPromises = batch.map(candidate => this.processMatch(targetTrip, candidate));
                const batchResults = yield Promise.all(batchPromises);
                results.push(...batchResults);
            }
            return results;
        });
    }
    processMatch(targetTrip, candidate) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const matchResult = (0, matchingService_1.calculateMatch)(targetTrip.routePolyline, candidate.routePolyline, targetTrip.routeDistance, candidate.routeDistance, this.config.advancedAlgorithm);
                return Object.assign(Object.assign({}, matchResult), { candidateId: candidate.id, processingTime: Date.now() - startTime, algorithmVersion: this.config.advancedAlgorithm ? 'advanced-v2' : 'legacy-v1' });
            }
            catch (error) {
                console.error(`Error processing match for candidate ${candidate.id}:`, error);
                return {
                    overlap: 0,
                    extraDist: 0,
                    score: 0,
                    valid: false,
                    candidateId: candidate.id,
                    processingTime: Date.now() - startTime,
                    algorithmVersion: 'error'
                };
            }
        });
    }
    getWorkerStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                isProcessing: this.isProcessing,
                config: this.config,
                timestamp: new Date().toISOString()
            };
        });
    }
    clearCache(tripId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.redis)
                return;
            if (tripId) {
                const cacheKey = `matches:${tripId}:v2`;
                yield this.redis.del(cacheKey);
            }
            else {
                // Clear all match caches
                const keys = yield this.redis.keys('matches:*:v2');
                if (keys.length > 0) {
                    yield this.redis.del(keys);
                }
            }
        });
    }
    benchmarkPerformance(sampleTripId_1) {
        return __awaiter(this, arguments, void 0, function* (sampleTripId, iterations = 10) {
            const results = [];
            for (let i = 0; i < iterations; i++) {
                const startTime = Date.now();
                const matches = yield this.findMatches(sampleTripId);
                const duration = Date.now() - startTime;
                results.push({
                    iteration: i + 1,
                    duration,
                    matchesFound: matches.length,
                    avgScore: matches.length > 0 ? matches.reduce((sum, m) => sum + m.score, 0) / matches.length : 0
                });
            }
            const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
            const avgMatches = results.reduce((sum, r) => sum + r.matchesFound, 0) / results.length;
            return {
                iterations,
                averageDuration: Math.round(avgDuration),
                averageMatches: Math.round(avgMatches * 10) / 10,
                results,
                algorithmVersion: this.config.advancedAlgorithm ? 'advanced-v2' : 'legacy-v1'
            };
        });
    }
}
exports.ProductionMatchingWorker = ProductionMatchingWorker;
