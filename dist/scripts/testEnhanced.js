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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prismaClient_1 = __importDefault(require("../db/prismaClient"));
const matchingWorker_1 = require("../services/matchingWorker");
const matchingService_1 = require("../services/matchingService");
function testEnhancedAlgorithm() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('🚀 Testing Enhanced Route Matching Algorithm\n');
        const worker = new matchingWorker_1.ProductionMatchingWorker(prismaClient_1.default, null, {
            advancedAlgorithm: true,
            maxConcurrentMatches: 50,
            minOverlapThreshold: 15
        });
        try {
            // Get sample trips
            const trips = yield prismaClient_1.default.trip.findMany({ take: 5, orderBy: { id: 'asc' } });
            if (trips.length < 2) {
                console.log('❌ Need at least 2 trips in database. Run sample data script first.');
                return;
            }
            console.log(`📊 Testing with ${trips.length} sample trips\n`);
            for (let i = 0; i < Math.min(trips.length, 3); i++) {
                const trip = trips[i];
                console.log(`🔍 Testing matches for Trip ${trip.id}:`);
                console.log(`   Route: (${trip.pickupLat.toFixed(4)}, ${trip.pickupLng.toFixed(4)}) → (${trip.dropLat.toFixed(4)}, ${trip.dropLng.toFixed(4)})`);
                console.log(`   Distance: ${(trip.routeDistance / 1000).toFixed(2)} km`);
                // Test enhanced algorithm
                const startTime = Date.now();
                const enhancedMatches = yield worker.findMatches(trip.id.toString());
                const enhancedTime = Date.now() - startTime;
                console.log(`   ✨ Enhanced Algorithm (v2): Found ${enhancedMatches.length} matches in ${enhancedTime}ms`);
                if (enhancedMatches.length > 0) {
                    enhancedMatches.slice(0, 3).forEach((match, idx) => {
                        var _a, _b;
                        console.log(`     ${idx + 1}. Trip ${match.candidateId}: ${match.overlap.toFixed(1)}% overlap, Score: ${match.score.toFixed(1)}`);
                        console.log(`        Fréchet: ${match.frechetDistance}m, Spatial: ${(_a = match.spatialSimilarity) === null || _a === void 0 ? void 0 : _a.toFixed(3)}`);
                        console.log(`        Compatibility: ${(_b = match.routeCompatibilityScore) === null || _b === void 0 ? void 0 : _b.toFixed(1)}%, Time: ${match.processingTime}ms`);
                    });
                }
                // Compare with legacy algorithm
                const legacyStartTime = Date.now();
                const candidates = yield prismaClient_1.default.trip.findMany({
                    where: {
                        id: { not: trip.id },
                        pickupLat: { gte: trip.pickupLat - 0.5, lte: trip.pickupLat + 0.5 },
                        pickupLng: { gte: trip.pickupLng - 0.5, lte: trip.pickupLng + 0.5 }
                    },
                    take: 20
                });
                const legacyMatches = candidates
                    .map(cand => {
                    const result = (0, matchingService_1.calculateMatch)(trip.routePolyline, cand.routePolyline, trip.routeDistance, cand.routeDistance, false // Use legacy algorithm
                    );
                    return Object.assign(Object.assign({}, result), { candidateId: cand.id });
                })
                    .filter(m => m.valid && m.score > 15)
                    .sort((a, b) => b.score - a.score);
                const legacyTime = Date.now() - legacyStartTime;
                console.log(`   📊 Legacy Algorithm (v1): Found ${legacyMatches.length} matches in ${legacyTime}ms`);
                if (legacyMatches.length > 0) {
                    legacyMatches.slice(0, 3).forEach((match, idx) => {
                        console.log(`     ${idx + 1}. Trip ${match.candidateId}: ${match.overlap.toFixed(1)}% overlap, Score: ${match.score.toFixed(1)}`);
                    });
                }
                console.log(`   ⚡ Performance: Enhanced ${enhancedTime < legacyTime ? 'FASTER' : 'SLOWER'} by ${Math.abs(enhancedTime - legacyTime)}ms\n`);
            }
            // Performance benchmark
            if (trips.length > 0) {
                console.log('🏁 Running Performance Benchmark...');
                const benchmarkResult = yield worker.benchmarkPerformance(trips[0].id.toString(), 5);
                console.log(`📈 Benchmark Results (${benchmarkResult.iterations} iterations):`);
                console.log(`   Average Duration: ${benchmarkResult.averageDuration}ms`);
                console.log(`   Average Matches: ${benchmarkResult.averageMatches}`);
                console.log(`   Algorithm: ${benchmarkResult.algorithmVersion}`);
                const fastest = Math.min(...benchmarkResult.results.map((r) => r.duration));
                const slowest = Math.max(...benchmarkResult.results.map((r) => r.duration));
                console.log(`   Range: ${fastest}ms - ${slowest}ms`);
            }
            console.log('\n✅ Enhanced Algorithm Testing Complete!');
            console.log('\n🎯 Key Improvements:');
            console.log('   ✓ Advanced polyline overlap calculation');
            console.log('   ✓ Fréchet distance for route similarity');
            console.log('   ✓ Spatial similarity scoring');
            console.log('   ✓ Route compatibility analysis');
            console.log('   ✓ Production-ready worker architecture');
        }
        catch (error) {
            console.error('❌ Error testing enhanced algorithm:', error);
        }
        finally {
            yield prismaClient_1.default.$disconnect();
        }
    });
}
// Algorithm comparison test
function compareAlgorithms(tripId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`\n🔬 Detailed Algorithm Comparison for Trip ${tripId}`);
        const trip = yield prismaClient_1.default.trip.findUnique({ where: { id: tripId } });
        if (!trip) {
            console.log('❌ Trip not found');
            return;
        }
        const candidates = yield prismaClient_1.default.trip.findMany({
            where: {
                id: { not: tripId },
                pickupLat: { gte: trip.pickupLat - 0.3, lte: trip.pickupLat + 0.3 }
            },
            take: 10
        });
        console.log(`Testing against ${candidates.length} candidates...\n`);
        for (const candidate of candidates.slice(0, 5)) {
            console.log(`Candidate ${candidate.id}:`);
            // Enhanced algorithm
            const enhanced = (0, matchingService_1.calculateMatch)(trip.routePolyline, candidate.routePolyline, trip.routeDistance, candidate.routeDistance, true);
            // Legacy algorithm
            const legacy = (0, matchingService_1.calculateMatch)(trip.routePolyline, candidate.routePolyline, trip.routeDistance, candidate.routeDistance, false);
            console.log(`  Enhanced: ${enhanced.overlap.toFixed(1)}% | Score: ${enhanced.score.toFixed(1)} | Valid: ${enhanced.valid}`);
            console.log(`  Legacy:   ${legacy.overlap.toFixed(1)}% | Score: ${legacy.score.toFixed(1)} | Valid: ${legacy.valid}`);
            if (enhanced.frechetDistance) {
                console.log(`  Fréchet Distance: ${enhanced.frechetDistance}m`);
            }
            if (enhanced.spatialSimilarity) {
                console.log(`  Spatial Similarity: ${enhanced.spatialSimilarity.toFixed(3)}`);
            }
            console.log('');
        }
    });
}
if (process.argv.includes('--compare')) {
    const tripId = parseInt(process.argv[3]) || 1;
    compareAlgorithms(tripId);
}
else {
    testEnhancedAlgorithm();
}
