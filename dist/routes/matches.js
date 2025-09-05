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
const prismaClient_1 = __importDefault(require("../db/prismaClient"));
const matchingService_1 = require("../services/matchingService");
const router = express_1.default.Router();
router.get('/:tripId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const tripId = Number(req.params.tripId);
    try {
        const baseTrip = yield prismaClient_1.default.trip.findUnique({ where: { id: tripId } });
        if (!baseTrip)
            return res.status(404).json({ error: 'Trip not found' });
        const startWindow = new Date(baseTrip.departureTime.getTime() - 30 * 60 * 1000);
        const endWindow = new Date(baseTrip.departureTime.getTime() + 30 * 60 * 1000);
        const candidates = yield prismaClient_1.default.trip.findMany({
            where: {
                departureTime: { gte: startWindow, lte: endWindow },
                NOT: { id: tripId },
            },
        });
        const matches = candidates
            .map((candidate) => {
            const match = (0, matchingService_1.calculateMatch)(baseTrip.routePolyline, candidate.routePolyline, baseTrip.routeDistance, candidate.routeDistance, baseTrip.departureTime, candidate.departureTime);
            return {
                matchedTripId: candidate.id,
                overlapPercent: match.overlap,
                extraDistancePercent: match.extraDist,
                matchScore: match.score,
                valid: match.valid,
                frechetDistance: match.frechetDist,
                similarity: match.similarity,
                destinationMatch: match.destMatch,
                routeType: match.routeType,
            };
        })
            .filter((m) => m.valid && m.matchScore > 0)
            .sort((a, b) => b.matchScore - a.matchScore);
        res.json({ tripId, matches });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
