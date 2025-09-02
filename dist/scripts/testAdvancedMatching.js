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
exports.testAdvancedMatching = testAdvancedMatching;
// Test script to demonstrate the new advanced polyline matching algorithm
const polylineUtils_1 = require("../utils/polylineUtils");
const matchingService_1 = require("../services/matchingService");
// Sample routes in Bengaluru with different overlap scenarios
const testRoutes = {
    // Route 1: Koramangala to Electronic City (Tech corridor)
    route1: {
        polyline: "mq}lAol_~LqCsCuCmCaFuEwD_DkCeBmCwAuBgAeCu@aDe@cE@cEXcDl@gCx@uBdAmBpAyArAmA|AeA`BsA`CcAdCu@nC_@rCGzC`@vCx@jC|@bChA`CjAtB`BdBpBbB|B`B`C|A`CrA`CdAbCt@dC`@bCFdCAhCUdCo@bC_AbCaBbCeBbC{B`C{B`CwBfC",
        distance: 12500
    },
    // Route 2: Similar route with slight variation (parallel road)
    route2: {
        polyline: "mq}lAol_~LqCsCuCmCaFuEwD_DkCeBmCwAuBgAeCu@aDe@cE@cEXcDl@gCx@uBdAmBpAyArAmA|AeA`BsA`CcAdCu@nC_@rCGzC`@vCx@jCbBdC|BfCrBrCdBbD`@vCGxCe@nC_AfCyA`C",
        distance: 12800
    },
    // Route 3: Completely different route (HSR Layout to Whitefield)
    route3: {
        polyline: "eq}lAcj_~LwEcFuDuDwCaCyBwAaCcAcDc@gE@iEb@iDx@gCtAmBnAyBpAcB|@gB~@gBdAeBdAaBfAeBfA_BhAwAfAyAdA_AnAw@pAo@rAi@tAc@tA]vAWzAQzAKzAEzA@xAHvANtATrAbAnD",
        distance: 15200
    },
    // Route 4: Reverse of route 1 (opposite direction)
    route4: {
        polyline: "wBfCsAhCiBbCkBbCsB`CsB`CwB|BeB`BqBtAcBnAmB`AcCt@cC`@gCGcC_@aC{@iChA_C|@gClAaCzA}B`BkBtAkBtAeB~@kB~@oBv@qBx@yBh@aBb@gCX_C@eCQcCi@oCcAiC_BiCyBgCoC",
        distance: 12600
    }
};
function testAdvancedMatching() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('\n🚀 Testing Advanced Polyline Matching Algorithm\n');
        console.log('='.repeat(60));
        // Test 1: Similar routes (should have high overlap)
        console.log('\n📊 Test 1: Similar Routes (Route 1 vs Route 2)');
        console.log('-'.repeat(50));
        const result1 = (0, matchingService_1.calculateMatch)(testRoutes.route1.polyline, testRoutes.route2.polyline, testRoutes.route1.distance, testRoutes.route2.distance);
        console.log(`✅ Overlap: ${result1.overlap}%`);
        console.log(`✅ Extra Distance: ${result1.extraDist}%`);
        console.log(`✅ Score: ${result1.score}`);
        console.log(`✅ Valid Match: ${result1.valid}`);
        if (result1.details) {
            console.log(`📍 Shared Distance: ${result1.details.sharedDistance}m`);
            console.log(`🧭 Directional Similarity: ${result1.details.directionalSimilarity}%`);
            console.log(`📏 Start Proximity: ${result1.details.startProximity}%`);
            console.log(`📏 End Proximity: ${result1.details.endProximity}%`);
        }
        // Test 2: Completely different routes (should have low overlap)
        console.log('\n📊 Test 2: Different Routes (Route 1 vs Route 3)');
        console.log('-'.repeat(50));
        const result2 = (0, matchingService_1.calculateMatch)(testRoutes.route1.polyline, testRoutes.route3.polyline, testRoutes.route1.distance, testRoutes.route3.distance);
        console.log(`❌ Overlap: ${result2.overlap}%`);
        console.log(`❌ Extra Distance: ${result2.extraDist}%`);
        console.log(`❌ Score: ${result2.score}`);
        console.log(`❌ Valid Match: ${result2.valid}`);
        if (result2.details) {
            console.log(`📍 Shared Distance: ${result2.details.sharedDistance}m`);
            console.log(`🧭 Directional Similarity: ${result2.details.directionalSimilarity}%`);
            console.log(`📏 Start Proximity: ${result2.details.startProximity}%`);
            console.log(`📏 End Proximity: ${result2.details.endProximity}%`);
        }
        // Test 3: Reverse route (should detect opposite direction)
        console.log('\n📊 Test 3: Reverse Routes (Route 1 vs Route 4)');
        console.log('-'.repeat(50));
        const result3 = (0, matchingService_1.calculateMatch)(testRoutes.route1.polyline, testRoutes.route4.polyline, testRoutes.route1.distance, testRoutes.route4.distance);
        console.log(`🔄 Overlap: ${result3.overlap}%`);
        console.log(`🔄 Extra Distance: ${result3.extraDist}%`);
        console.log(`🔄 Score: ${result3.score}`);
        console.log(`🔄 Valid Match: ${result3.valid}`);
        if (result3.details) {
            console.log(`📍 Shared Distance: ${result3.details.sharedDistance}m`);
            console.log(`🧭 Directional Similarity: ${result3.details.directionalSimilarity}%`);
            console.log(`📏 Start Proximity: ${result3.details.startProximity}%`);
            console.log(`📏 End Proximity: ${result3.details.endProximity}%`);
        }
        // Test 4: Advanced analysis comparison
        console.log('\n📊 Test 4: Advanced Analysis Breakdown');
        console.log('-'.repeat(50));
        const points1 = (0, polylineUtils_1.decodePolyline)(testRoutes.route1.polyline);
        const points2 = (0, polylineUtils_1.decodePolyline)(testRoutes.route2.polyline);
        const oldOverlap = (0, polylineUtils_1.approximateOverlap)(points1, points2, 100);
        const advancedAnalysis = (0, polylineUtils_1.calculateAdvancedOverlap)(points1, points2, 150);
        console.log(`🔍 Old Algorithm Overlap: ${oldOverlap.toFixed(2)}%`);
        console.log(`🚀 New Algorithm Overlap: ${advancedAnalysis.overlapPercentage.toFixed(2)}%`);
        console.log(`📏 Total Distance Route 1: ${advancedAnalysis.totalDistanceA.toFixed(0)}m`);
        console.log(`📏 Total Distance Route 2: ${advancedAnalysis.totalDistanceB.toFixed(0)}m`);
        console.log(`🤝 Shared Distance: ${advancedAnalysis.sharedDistance.toFixed(0)}m`);
        console.log(`🧭 Directional Similarity: ${advancedAnalysis.directionalSimilarity.toFixed(2)}%`);
        console.log(`📐 Route Deviation: ${advancedAnalysis.routeDeviation.toFixed(2)}%`);
        // Test 5: Performance comparison
        console.log('\n⚡ Test 5: Performance Comparison');
        console.log('-'.repeat(50));
        const iterations = 1000;
        // Old algorithm timing
        const oldStart = Date.now();
        for (let i = 0; i < iterations; i++) {
            (0, polylineUtils_1.approximateOverlap)(points1, points2, 100);
        }
        const oldTime = Date.now() - oldStart;
        // New algorithm timing
        const newStart = Date.now();
        for (let i = 0; i < iterations; i++) {
            (0, polylineUtils_1.calculateAdvancedOverlap)(points1, points2, 150);
        }
        const newTime = Date.now() - newStart;
        console.log(`⚡ Old Algorithm: ${oldTime}ms for ${iterations} iterations`);
        console.log(`🚀 New Algorithm: ${newTime}ms for ${iterations} iterations`);
        console.log(`📊 Performance Ratio: ${(newTime / oldTime).toFixed(2)}x`);
        console.log('\n🎉 Advanced Matching Algorithm Test Complete!');
        console.log('='.repeat(60));
    });
}
if (require.main === module) {
    testAdvancedMatching().catch(console.error);
}
