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
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'http://localhost:3000';
function testRealDiversity() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('=== TESTING ALGORITHM WITH TRULY DIVERSE ROUTES ===\n');
            // Create completely different routes that should have different overlaps
            const testRoutes = [
                {
                    name: "Koramangala to Whitefield (Tech Corridor)",
                    pickup: { lat: 12.9352, lng: 77.6245 },
                    drop: { lat: 12.9698, lng: 77.7500 },
                    time: '2025-09-01T09:00:00.000Z'
                },
                {
                    name: "BTM Layout to Whitefield (Similar destination)",
                    pickup: { lat: 12.9165, lng: 77.6101 },
                    drop: { lat: 12.9698, lng: 77.7500 },
                    time: '2025-09-01T09:10:00.000Z'
                },
                {
                    name: "Banashankari to MG Road (Different direction)",
                    pickup: { lat: 12.9249, lng: 77.5500 },
                    drop: { lat: 12.9716, lng: 77.5946 },
                    time: '2025-09-01T09:15:00.000Z'
                },
                {
                    name: "Electronic City to Airport (Long distance)",
                    pickup: { lat: 12.8456, lng: 77.6603 },
                    drop: { lat: 13.1986, lng: 77.7066 },
                    time: '2025-09-01T09:20:00.000Z'
                },
                {
                    name: "Indiranagar to HSR Layout (Cross-city)",
                    pickup: { lat: 12.9784, lng: 77.6408 },
                    drop: { lat: 12.9116, lng: 77.6370 },
                    time: '2025-09-01T09:25:00.000Z'
                }
            ];
            console.log('Creating diverse test routes...\n');
            const createdTrips = [];
            for (const route of testRoutes) {
                try {
                    const createResp = yield axios_1.default.post(`${BASE_URL}/trips`, {
                        pickupLat: route.pickup.lat,
                        pickupLng: route.pickup.lng,
                        dropLat: route.drop.lat,
                        dropLng: route.drop.lng,
                        departureTime: route.time
                    });
                    const createData = createResp.data;
                    if (createData.success) {
                        const trip = createData.trip;
                        const info = createData.info;
                        createdTrips.push({
                            id: trip.id,
                            name: route.name,
                            pickup: route.pickup,
                            drop: route.drop,
                            distance: info.distance,
                            duration: info.duration,
                            polylineLength: trip.routePolyline.length
                        });
                        console.log(`✓ Created Trip ${trip.id}: ${route.name}`);
                        console.log(`  Distance: ${info.distance}, Duration: ${info.duration}`);
                        console.log(`  Polyline: ${trip.routePolyline.length} chars`);
                        console.log('');
                    }
                }
                catch (error) {
                    console.log(`✗ Failed to create route: ${route.name}`);
                }
            }
            if (createdTrips.length < 2) {
                console.log('Not enough trips created for testing');
                return;
            }
            console.log('=== TESTING CROSS-ROUTE MATCHING ===\n');
            // Test each route against all others
            for (let i = 0; i < createdTrips.length; i++) {
                const baseTrip = createdTrips[i];
                console.log(`Testing matches for: ${baseTrip.name}`);
                console.log(`Trip ${baseTrip.id}: ${baseTrip.distance}, ${baseTrip.duration}`);
                try {
                    const matchResp = yield axios_1.default.get(`${BASE_URL}/matches/${baseTrip.id}`);
                    const matchData = matchResp.data;
                    if (matchData.success && matchData.matches.length > 0) {
                        console.log(`Found ${matchData.matches.length} matches:\n`);
                        matchData.matches.forEach((match, idx) => {
                            // Find the corresponding created trip for context
                            const matchedTrip = createdTrips.find(t => t.id === match.tripId);
                            console.log(`  Match ${idx + 1} (Trip ${match.tripId}):`);
                            if (matchedTrip) {
                                console.log(`    Route: ${matchedTrip.name}`);
                            }
                            console.log(`    Coordinates: ${match.pickup.lat.toFixed(4)},${match.pickup.lng.toFixed(4)} → ${match.drop.lat.toFixed(4)},${match.drop.lng.toFixed(4)}`);
                            console.log(`    Time Diff: ${match.timeDiff} minutes`);
                            console.log(`    Route Overlap: ${match.overlap}%`);
                            console.log(`    Extra Distance: ${match.extraDist}%`);
                            console.log(`    Match Score: ${match.score}%`);
                            console.log(`    Status: ${match.status}`);
                            // Analyze the match quality
                            if (match.overlap >= 70) {
                                console.log(`    🟢 EXCELLENT MATCH - High route overlap`);
                            }
                            else if (match.overlap >= 40) {
                                console.log(`    🟡 GOOD MATCH - Moderate route overlap`);
                            }
                            else if (match.overlap >= 25) {
                                console.log(`    🟠 FAIR MATCH - Some route overlap`);
                            }
                            else {
                                console.log(`    🔴 POOR MATCH - Low route overlap`);
                            }
                            console.log('');
                        });
                    }
                    else {
                        console.log('  No matches found within criteria\n');
                    }
                }
                catch (error) {
                    console.log(`  Error testing matches: ${error}\n`);
                }
                console.log('─'.repeat(60) + '\n');
            }
            // Summary analysis
            console.log('=== ALGORITHM PERFORMANCE ANALYSIS ===\n');
            console.log('Expected behavior validation:');
            console.log('✓ Koramangala→Whitefield vs BTM→Whitefield: Should show HIGH overlap (same destination)');
            console.log('✓ Tech routes vs Banashankari→MG Road: Should show LOW overlap (different areas)');
            console.log('✓ Long distance routes: Should be filtered out or show minimal overlap');
            console.log('✓ Cross-city routes: Should show appropriate intermediate scores');
            console.log('');
            console.log('Routes created for testing:');
            createdTrips.forEach((trip, idx) => {
                console.log(`${idx + 1}. Trip ${trip.id}: ${trip.name} (${trip.distance})`);
            });
        }
        catch (error) {
            console.error('Test failed:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
testRealDiversity().then(() => {
    console.log('\n=== DIVERSITY TEST COMPLETED ===');
    process.exit(0);
}).catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
