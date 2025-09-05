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
const osrmService_1 = require("../services/osrmService");
const router = express_1.default.Router();
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pickupLat, pickupLng, dropLat, dropLng, departureTime } = req.body;
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
        res.status(201).json(trip);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
