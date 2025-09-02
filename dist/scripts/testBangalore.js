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
const bangaloreLocations = {
    koramangala: { lat: 12.9352, lng: 77.6245, name: "Koramangala" },
    whitefield: { lat: 12.9698, lng: 77.7500, name: "Whitefield" },
    electronicCity: { lat: 12.8456, lng: 77.6603, name: "Electronic City" },
    indiranagar: { lat: 12.9784, lng: 77.6408, name: "Indiranagar" },
    banashankari: { lat: 12.9249, lng: 77.5500, name: "Banashankari" },
    jayanagar: { lat: 12.9279, lng: 77.5937, name: "Jayanagar" },
    hsrLayout: { lat: 12.9116, lng: 77.6370, name: "HSR Layout" },
    btmLayout: { lat: 12.9165, lng: 77.6101, name: "BTM Layout" },
    mgRoad: { lat: 12.9716, lng: 77.5946, name: "MG Road" },
    marathahalli: { lat: 12.9591, lng: 77.6974, name: "Marathahalli" },
    silkBoard: { lat: 12.9177, lng: 77.6162, name: "Silk Board" },
    hebbal: { lat: 13.0356, lng: 77.5970, name: "Hebbal" },
    vijayanagar: { lat: 12.9626, lng: 77.5382, name: "Vijayanagar" },
    rajajinagar: { lat: 12.9964, lng: 77.5553, name: "Rajajinagar" },
    malleshwaram: { lat: 13.0031, lng: 77.5748, name: "Malleshwaram" }
};
const testScenarios = [
    {
        pickup: bangaloreLocations.koramangala,
        drop: bangaloreLocations.whitefield,
        departureTime: '2025-09-01T08:30:00.000Z',
        description: 'Morning commute: Koramangala to Whitefield IT corridor'
    },
    {
        pickup: bangaloreLocations.indiranagar,
        drop: bangaloreLocations.electronicCity,
        departureTime: '2025-09-01T09:00:00.000Z',
        description: 'Cross-city route: Indiranagar to Electronic City'
    },
    {
        pickup: bangaloreLocations.hebbal,
        drop: bangaloreLocations.hsrLayout,
        departureTime: '2025-09-01T08:45:00.000Z',
        description: 'North to South: Hebbal to HSR Layout'
    },
    {
        pickup: bangaloreLocations.malleshwaram,
        drop: bangaloreLocations.marathahalli,
        departureTime: '2025-09-01T09:15:00.000Z',
        description: 'West to East: Malleshwaram to Marathahalli'
    },
    {
        pickup: bangaloreLocations.banashankari,
        drop: bangaloreLocations.mgRoad,
        departureTime: '2025-09-01T08:50:00.000Z',
        description: 'South to Central: Banashankari to MG Road'
    }
];
function testWithRealBangaloreLocations() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
        try {
            console.log('=== REAL BANGALORE LOCATIONS TEST ===\n');
            // Check server health
            const healthResp = yield axios_1.default.get(`${BASE_URL}/health`);
            const healthData = healthResp.data;
            console.log('Server Status:', healthData.status);
            console.log();
            console.log('Creating realistic Bangalore trips...\n');
            const createdTrips = [];
            // Create test trips with real routes
            for (let i = 0; i < testScenarios.length; i++) {
                const scenario = testScenarios[i];
                console.log(`${i + 1}. ${scenario.description}`);
                console.log(`   From: ${scenario.pickup.name} (${scenario.pickup.lat}, ${scenario.pickup.lng})`);
                console.log(`   To: ${scenario.drop.name} (${scenario.drop.lat}, ${scenario.drop.lng})`);
                console.log(`   Time: ${new Date(scenario.departureTime).toLocaleTimeString()}`);
                try {
                    const createResp = yield axios_1.default.post(`${BASE_URL}/trips`, {
                        pickupLat: scenario.pickup.lat,
                        pickupLng: scenario.pickup.lng,
                        dropLat: scenario.drop.lat,
                        dropLng: scenario.drop.lng,
                        departureTime: scenario.departureTime
                    });
                    const tripData = createResp.data;
                    if (tripData.success) {
                        createdTrips.push({
                            id: tripData.trip.id,
                            scenario: scenario,
                            distance: tripData.info.distance,
                            duration: tripData.info.duration
                        });
                        console.log(`   ✓ Created trip ID ${tripData.trip.id} - ${tripData.info.distance}, ${tripData.info.duration}`);
                    }
                }
                catch (error) {
                    console.log(`   ✗ Failed to create trip: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error.message}`);
                }
                console.log();
                yield new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
            }
            console.log('\n=== TESTING ROUTE MATCHING ===\n');
            // Test matching for each created trip
            for (const trip of createdTrips) {
                console.log(`Testing matches for Trip ${trip.id}:`);
                console.log(`Route: ${trip.scenario.pickup.name} → ${trip.scenario.drop.name}`);
                console.log(`Distance: ${trip.distance}, Duration: ${trip.duration}`);
                console.log();
                try {
                    const matchResp = yield axios_1.default.get(`${BASE_URL}/matches/${trip.id}`);
                    const matchData = matchResp.data;
                    if (matchData.success && matchData.count > 0) {
                        console.log(`Found ${matchData.count} potential matches:`);
                        matchData.matches.forEach((match, idx) => {
                            // Find the names of pickup/drop locations
                            const pickupName = findLocationName(match.pickup.lat, match.pickup.lng);
                            const dropName = findLocationName(match.drop.lat, match.drop.lng);
                            console.log(`\n  Match ${idx + 1}:`);
                            console.log(`  ├─ Route: ${pickupName} → ${dropName}`);
                            console.log(`  ├─ Time Difference: ${match.timeDiff} minutes`);
                            console.log(`  ├─ Route Overlap: ${match.overlap}%`);
                            console.log(`  ├─ Extra Distance: ${match.extraDist}%`);
                            console.log(`  ├─ Match Score: ${match.score}%`);
                            console.log(`  └─ Compatibility: ${getCompatibilityRating(match.score)}`);
                        });
                    }
                    else {
                        console.log('No matches found for this route');
                    }
                }
                catch (error) {
                    console.log(`Error finding matches: ${((_d = (_c = error.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error) || error.message}`);
                }
                console.log('\n' + '─'.repeat(60) + '\n');
            }
            // Test a specific high-potential match scenario
            console.log('=== TESTING SIMILAR ROUTES ===\n');
            yield testSimilarRoutes();
        }
        catch (error) {
            console.error('Test failed:', ((_e = error.response) === null || _e === void 0 ? void 0 : _e.data) || error.message);
        }
    });
}
function testSimilarRoutes() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        console.log('Creating similar routes to test matching accuracy...\n');
        // Create two very similar routes (same destination, nearby pickup points)
        const similarRoute1 = {
            pickupLat: bangaloreLocations.koramangala.lat,
            pickupLng: bangaloreLocations.koramangala.lng,
            dropLat: bangaloreLocations.whitefield.lat,
            dropLng: bangaloreLocations.whitefield.lng,
            departureTime: '2025-09-01T09:00:00.000Z'
        };
        const similarRoute2 = {
            pickupLat: bangaloreLocations.hsrLayout.lat, // Nearby to Koramangala
            pickupLng: bangaloreLocations.hsrLayout.lng,
            dropLat: bangaloreLocations.whitefield.lat,
            dropLng: bangaloreLocations.whitefield.lng,
            departureTime: '2025-09-01T09:05:00.000Z' // 5 minutes later
        };
        try {
            console.log('1. Creating route: Koramangala → Whitefield');
            const trip1 = yield axios_1.default.post(`${BASE_URL}/trips`, similarRoute1);
            yield new Promise(resolve => setTimeout(resolve, 1000));
            console.log('2. Creating route: HSR Layout → Whitefield');
            const trip2 = yield axios_1.default.post(`${BASE_URL}/trips`, similarRoute2);
            const trip1Data = trip1.data;
            const trip2Data = trip2.data;
            if (trip1Data.success && trip2Data.success) {
                const tripId1 = trip1Data.trip.id;
                const tripId2 = trip2Data.trip.id;
                console.log(`\nTrip ${tripId1}: ${trip1Data.info.distance}, ${trip1Data.info.duration}`);
                console.log(`Trip ${tripId2}: ${trip2Data.info.distance}, ${trip2Data.info.duration}`);
                yield new Promise(resolve => setTimeout(resolve, 1000));
                console.log(`\nTesting matches for Trip ${tripId1}:`);
                const matches = yield axios_1.default.get(`${BASE_URL}/matches/${tripId1}`);
                const matchesData = matches.data;
                if (matchesData.success && matchesData.count > 0) {
                    console.log(`Found ${matchesData.count} matches:`);
                    matchesData.matches.forEach((match, idx) => {
                        if (match.tripId === tripId2) {
                            console.log(`\n✅ EXCELLENT MATCH FOUND:`);
                            console.log(`   Routes: Both going to Whitefield`);
                            console.log(`   Pickup Distance: ~2.5km apart (Koramangala ↔ HSR)`);
                            console.log(`   Time Gap: 5 minutes`);
                            console.log(`   Route Overlap: ${match.overlap}%`);
                            console.log(`   Match Score: ${match.score}%`);
                            console.log(`   This is a perfect carpooling match!`);
                        }
                    });
                }
            }
        }
        catch (error) {
            console.log(`Error in similar routes test: ${((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || error.message}`);
        }
    });
}
function findLocationName(lat, lng) {
    const threshold = 0.01; // ~1km tolerance
    for (const [key, location] of Object.entries(bangaloreLocations)) {
        const latDiff = Math.abs(location.lat - lat);
        const lngDiff = Math.abs(location.lng - lng);
        if (latDiff < threshold && lngDiff < threshold) {
            return location.name;
        }
    }
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
function getCompatibilityRating(score) {
    if (score >= 70)
        return 'Excellent Match 🟢';
    if (score >= 50)
        return 'Good Match 🟡';
    if (score >= 30)
        return 'Fair Match 🟠';
    return 'Poor Match 🔴';
}
// Run the test
if (require.main === module) {
    testWithRealBangaloreLocations()
        .then(() => {
        console.log('\n=== BANGALORE LOCATIONS TEST COMPLETED ===');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}
