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
function debugMatching() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('=== DEBUGGING ROUTE MATCHING ALGORITHM ===\n');
            // Get some existing trips
            const tripsResp = yield axios_1.default.get(`${BASE_URL}/trips`);
            const trips = tripsResp.data.trips;
            console.log(`Total trips in database: ${trips.length}\n`);
            // Pick a few different routes for analysis
            const selectedTrips = trips.slice(0, 5);
            console.log('=== ANALYZING ROUTE POLYLINES ===\n');
            selectedTrips.forEach((trip, idx) => {
                console.log(`Trip ${trip.id}:`);
                console.log(`  Route: ${trip.pickupLat.toFixed(4)},${trip.pickupLng.toFixed(4)} → ${trip.dropLat.toFixed(4)},${trip.dropLng.toFixed(4)}`);
                console.log(`  Distance: ${trip.distance}`);
                console.log(`  Polyline length: ${trip.routePolyline.length} chars`);
                console.log(`  Polyline preview: ${trip.routePolyline.substring(0, 50)}...`);
                console.log('');
            });
            // Test match calculation between different routes
            if (selectedTrips.length >= 2) {
                console.log('=== TESTING ROUTE MATCHING ===\n');
                const trip1 = selectedTrips[0];
                const trip2 = selectedTrips[1];
                console.log(`Testing match between Trip ${trip1.id} and Trip ${trip2.id}:`);
                console.log(`Trip ${trip1.id}: ${trip1.pickupLat.toFixed(4)},${trip1.pickupLng.toFixed(4)} → ${trip1.dropLat.toFixed(4)},${trip1.dropLng.toFixed(4)}`);
                console.log(`Trip ${trip2.id}: ${trip2.pickupLat.toFixed(4)},${trip2.pickupLng.toFixed(4)} → ${trip2.dropLat.toFixed(4)},${trip2.dropLng.toFixed(4)}`);
                // Call the matches endpoint
                const matchResp = yield axios_1.default.get(`${BASE_URL}/matches/${trip1.id}`);
                const matchData = matchResp.data;
                if (matchData.success && matchData.matches.length > 0) {
                    console.log('\nFound matches:');
                    matchData.matches.forEach((match, idx) => {
                        console.log(`  Match ${idx + 1} (Trip ${match.tripId}):`);
                        console.log(`    Route: ${match.pickup.lat.toFixed(4)},${match.pickup.lng.toFixed(4)} → ${match.drop.lat.toFixed(4)},${match.drop.lng.toFixed(4)}`);
                        console.log(`    Overlap: ${match.overlap}%`);
                        console.log(`    Extra Distance: ${match.extraDist}%`);
                        console.log(`    Score: ${match.score}%`);
                        console.log('');
                    });
                }
                else {
                    console.log('No matches found');
                }
            }
            // Test with completely different routes
            console.log('=== TESTING WITH DIVERSE ROUTES ===\n');
            // Create two very different routes for testing
            const testRoute1 = {
                pickupLat: 12.9352, // Koramangala
                pickupLng: 77.6245,
                dropLat: 12.9698, // Whitefield  
                dropLng: 77.7500,
                departureTime: '2025-09-01T10:00:00.000Z'
            };
            const testRoute2 = {
                pickupLat: 12.9249, // Banashankari (very different area)
                pickupLng: 77.5500,
                dropLat: 12.9716, // MG Road
                dropLng: 77.5946,
                departureTime: '2025-09-01T10:05:00.000Z'
            };
            console.log('Creating test route 1 (Koramangala → Whitefield):');
            const createResp1 = yield axios_1.default.post(`${BASE_URL}/trips`, testRoute1);
            const trip1Data = createResp1.data;
            if (trip1Data.success) {
                console.log(`✓ Created Trip ${trip1Data.trip.id}: ${trip1Data.info.distance}, ${trip1Data.info.duration}`);
                console.log(`  Polyline length: ${trip1Data.trip.routePolyline.length} chars`);
            }
            console.log('\nCreating test route 2 (Banashankari → MG Road):');
            const createResp2 = yield axios_1.default.post(`${BASE_URL}/trips`, testRoute2);
            const trip2Data = createResp2.data;
            if (trip2Data.success) {
                console.log(`✓ Created Trip ${trip2Data.trip.id}: ${trip2Data.info.distance}, ${trip2Data.info.duration}`);
                console.log(`  Polyline length: ${trip2Data.trip.routePolyline.length} chars`);
            }
            // Test matching between these diverse routes
            if (trip1Data.success && trip2Data.success) {
                console.log(`\nTesting matches for diverse route (Trip ${trip1Data.trip.id}):`);
                const diverseMatchResp = yield axios_1.default.get(`${BASE_URL}/matches/${trip1Data.trip.id}`);
                const diverseMatchData = diverseMatchResp.data;
                if (diverseMatchData.success) {
                    console.log(`Found ${diverseMatchData.count} matches:`);
                    diverseMatchData.matches.forEach((match, idx) => {
                        console.log(`  Match ${idx + 1} (Trip ${match.tripId}):`);
                        console.log(`    Route: ${match.pickup.lat.toFixed(4)},${match.pickup.lng.toFixed(4)} → ${match.drop.lat.toFixed(4)},${match.drop.lng.toFixed(4)}`);
                        console.log(`    Time Diff: ${match.timeDiff} min`);
                        console.log(`    Overlap: ${match.overlap}%`);
                        console.log(`    Extra Distance: ${match.extraDist}%`);
                        console.log(`    Score: ${match.score}%`);
                        console.log(`    Valid: ${match.valid}`);
                        // Check if this is the problematic same-coordinate matching
                        if (match.overlap === 100) {
                            console.log(`    ⚠️  WARNING: 100% overlap detected!`);
                        }
                        if (match.pickup.lat === testRoute1.pickupLat && match.pickup.lng === testRoute1.pickupLng) {
                            console.log(`    ⚠️  WARNING: Identical pickup coordinates!`);
                        }
                        console.log('');
                    });
                }
            }
        }
        catch (error) {
            console.error('Debug failed:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
debugMatching().then(() => {
    console.log('\n=== DEBUGGING COMPLETE ===');
    process.exit(0);
}).catch(error => {
    console.error('Debug runner error:', error);
    process.exit(1);
});
