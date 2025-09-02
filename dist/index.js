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
const express_1 = __importDefault(require("express"));
const osrmService_1 = require("./services/osrmService");
const matchingService_1 = require("./services/matchingService");
const prismaClient_1 = __importDefault(require("./db/prismaClient"));
const app = (0, express_1.default)();
const port = 3000;
app.use(express_1.default.json());
app.get('/health', (req, res) => {
    res.json({ status: 'OK', time: new Date().toISOString() });
});
app.post('/trips', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pickupLat, pickupLng, dropLat, dropLng, departureTime } = req.body;
        if (!pickupLat || !pickupLng || !dropLat || !dropLng || !departureTime) {
            return res.status(400).json({
                error: 'Missing fields: pickupLat, pickupLng, dropLat, dropLng, departureTime'
            });
        }
        const routeData = yield (0, osrmService_1.getRoute)(pickupLat, pickupLng, dropLat, dropLng);
        const trip = yield prismaClient_1.default.trip.create({
            data: {
                pickupLat,
                pickupLng,
                dropLat,
                dropLng,
                departureTime: new Date(departureTime),
                routePolyline: routeData.polyline,
                routeDistance: routeData.distance,
                routeDuration: routeData.duration,
            },
        });
        res.status(201).json({
            success: true,
            trip,
            info: {
                distance: `${(routeData.distance / 1000).toFixed(2)} km`,
                duration: `${Math.round(routeData.duration / 60)} min`
            }
        });
    }
    catch (error) {
        console.error('Trip creation error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/trips', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const trips = yield prismaClient_1.default.trip.findMany({
            orderBy: { createdAt: 'desc' }
        });
        const data = trips.map(trip => (Object.assign(Object.assign({}, trip), { distance: `${(trip.routeDistance / 1000).toFixed(2)} km`, duration: `${Math.round(trip.routeDuration / 60)} min`, departureTime: trip.departureTime.toISOString() })));
        res.json({ success: true, trips: data, count: trips.length });
    }
    catch (error) {
        console.error('Trips fetch error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.get('/matches/:tripId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = Number(req.params.tripId);
    try {
        const baseTrip = yield prismaClient_1.default.trip.findUnique({ where: { id: tripId } });
        if (!baseTrip)
            return res.status(404).json({ error: 'Trip not found' });
        const timeWindow = 30 * 60 * 1000;
        const startTime = new Date(baseTrip.departureTime.getTime() - timeWindow);
        const endTime = new Date(baseTrip.departureTime.getTime() + timeWindow);
        const candidates = yield prismaClient_1.default.trip.findMany({
            where: {
                departureTime: { gte: startTime, lte: endTime },
                NOT: { id: tripId },
            },
        });
        const matches = candidates
            .map((cand) => {
            const { overlap, extraDist, score, valid } = (0, matchingService_1.calculateMatch)(baseTrip.routePolyline, cand.routePolyline, baseTrip.routeDistance, cand.routeDistance);
            const timeDiff = Math.abs(cand.departureTime.getTime() - baseTrip.departureTime.getTime()) / (1000 * 60);
            return {
                tripId: cand.id,
                pickup: { lat: cand.pickupLat, lng: cand.pickupLng },
                drop: { lat: cand.dropLat, lng: cand.dropLng },
                departureTime: cand.departureTime.toISOString(),
                timeDiff: Math.round(timeDiff),
                overlap,
                extraDist,
                score,
                valid,
                addDist: `${((cand.routeDistance - baseTrip.routeDistance) / 1000).toFixed(2)} km`,
                status: valid ? 'Match' : 'No Match'
            };
        })
            .filter((m) => m.valid && m.score > 15)
            .sort((a, b) => b.score - a.score);
        res.json({
            success: true,
            base: {
                id: baseTrip.id,
                pickup: { lat: baseTrip.pickupLat, lng: baseTrip.pickupLng },
                drop: { lat: baseTrip.dropLat, lng: baseTrip.dropLng },
                departureTime: baseTrip.departureTime.toISOString(),
                distance: `${(baseTrip.routeDistance / 1000).toFixed(2)} km`,
                duration: `${Math.round(baseTrip.routeDuration / 60)} min`
            },
            matches,
            count: matches.length,
            window: {
                start: startTime.toISOString(),
                end: endTime.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Match finding error:', error);
        res.status(500).json({ error: error.message });
    }
}));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log('Endpoints:');
    console.log('  GET  /health');
    console.log('  GET  /trips');
    console.log('  POST /trips');
    console.log('  GET  /matches/:tripId');
});
