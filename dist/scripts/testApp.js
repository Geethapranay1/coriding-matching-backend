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
exports.testRouteMatching = testRouteMatching;
exports.generateSampleOutput = generateSampleOutput;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'http://localhost:3000';
const testTrip = {
    pickupLat: 12.9352,
    pickupLng: 77.6245,
    dropLat: 12.9698,
    dropLng: 77.7500,
    departureTime: '2025-09-01T09:08:00.000Z',
    desc: 'Koramangala to Whitefield at 9:08 AM'
};
function testRouteMatching() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            console.log('Starting Route Matching Test...\n');
            console.log('1. Checking server health...');
            const healthResp = yield axios_1.default.get(`${BASE_URL}/health`);
            console.log('Server is healthy:', healthResp.data);
            console.log();
            console.log('2. Fetching existing trips...');
            const tripsResp = yield axios_1.default.get(`${BASE_URL}/trips`);
            const tripsData = tripsResp.data;
            console.log(`Found ${tripsData.count} existing trips`);
            if (tripsData.count > 0) {
                console.log('First few trips:');
                tripsData.trips.slice(0, 3).forEach((trip, idx) => {
                    console.log(`   ${idx + 1}. Trip ${trip.id}: ${trip.distance}, ${trip.duration}`);
                });
            }
            console.log();
            console.log('3. Creating test trip...');
            console.log(`   ${testTrip.desc}`);
            const createResp = yield axios_1.default.post(`${BASE_URL}/trips`, testTrip);
            const createData = createResp.data;
            if (createData.success) {
                const newTrip = createData.trip;
                console.log(`Test trip created with ID: ${newTrip.id}`);
                console.log(`   Route: ${createData.info.distance}, ${createData.info.duration}`);
                console.log();
                console.log('4. Finding matches for the test trip...');
                const matchesResp = yield axios_1.default.get(`${BASE_URL}/matches/${newTrip.id}`);
                const matchesData = matchesResp.data;
                if (matchesData.success) {
                    const { base, matches, count } = matchesData;
                    console.log(`Base Trip Details:`);
                    console.log(`   ID: ${base.id}`);
                    console.log(`   Route: ${base.pickup.lat.toFixed(4)},${base.pickup.lng.toFixed(4)} → ${base.drop.lat.toFixed(4)},${base.drop.lng.toFixed(4)}`);
                    console.log(`   Distance: ${base.distance}`);
                    console.log(`   Departure: ${new Date(base.departureTime).toLocaleString()}`);
                    console.log();
                    console.log(`Found ${count} matching rides:`);
                    if (count > 0) {
                        matches.forEach((match, idx) => {
                            console.log(`\n   Match ${idx + 1}:`);
                            console.log(`   ├── Trip ID: ${match.tripId}`);
                            console.log(`   ├── Route: ${match.pickup.lat.toFixed(4)},${match.pickup.lng.toFixed(4)} → ${match.drop.lat.toFixed(4)},${match.drop.lng.toFixed(4)}`);
                            console.log(`   ├── Time Diff: ${match.timeDiff} min`);
                            console.log(`   ├── Route Overlap: ${match.overlap}%`);
                            console.log(`   ├── Extra Distance: ${match.extraDist}%`);
                            console.log(`   ├── Match Score: ${match.score}%`);
                            console.log(`   ├── Add Distance: ${match.addDist}`);
                            console.log(`   └── Status: ${match.status}`);
                        });
                    }
                    else {
                        console.log('   No matches found within criteria');
                    }
                    console.log(`\nSearch Details:`);
                    console.log(`   Time Window: ±30 minutes`);
                    console.log(`   Window Start: ${new Date(matchesData.window.start).toLocaleString()}`);
                    console.log(`   Window End: ${new Date(matchesData.window.end).toLocaleString()}`);
                }
                else {
                    console.log('Failed to find matches');
                }
            }
            else {
                console.log('Failed to create test trip');
            }
            console.log('\nTest completed successfully');
        }
        catch (error) {
            console.error('Test failed:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
function generateSampleOutput() {
    const sampleOutput = {
        "success": true,
        "base": {
            "id": 8,
            "pickup": { "lat": 12.9352, "lng": 77.6245 },
            "drop": { "lat": 12.9698, "lng": 77.7500 },
            "departureTime": "2025-09-01T09:08:00.000Z",
            "distance": "18.45 km",
            "duration": "45 min"
        },
        "matches": [
            {
                "tripId": 1,
                "pickup": { "lat": 12.9352, "lng": 77.6245 },
                "drop": { "lat": 12.9698, "lng": 77.7500 },
                "departureTime": "2025-09-01T09:00:00.000Z",
                "timeDiff": 8,
                "overlap": 95.2,
                "extraDist": 2.1,
                "score": 85.6,
                "valid": true,
                "addDist": "0.35 km",
                "status": "Match"
            }
        ],
        "count": 1,
        "window": {
            "start": "2025-09-01T08:38:00.000Z",
            "end": "2025-09-01T09:38:00.000Z"
        }
    };
    console.log('\nSample JSON Output:');
    console.log(JSON.stringify(sampleOutput, null, 2));
}
if (require.main === module) {
    testRouteMatching()
        .then(() => {
        generateSampleOutput();
        process.exit(0);
    })
        .catch((error) => {
        console.error('Test runner error:', error);
        process.exit(1);
    });
}
