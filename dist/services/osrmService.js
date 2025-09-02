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
exports.getRoute = getRoute;
const axios_1 = __importDefault(require("axios"));
const redisClient_1 = require("../db/redisClient");
function getRoute(pickupLat, pickupLng, dropLat, dropLng) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const key = `rt:${pickupLat},${pickupLng}-${dropLat},${dropLng}`;
        const cached = yield (0, redisClient_1.getCache)(key);
        if (cached)
            return cached;
        const url = `${process.env.OSRM_URL}/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}?overview=full&geometries=polyline`;
        const resp = yield axios_1.default.get(url);
        const data = resp.data;
        if (data.code !== 'Ok')
            throw new Error('Route fetch failed: ' + ((_a = data.message) !== null && _a !== void 0 ? _a : 'Unknown error'));
        const route = data.routes[0];
        const result = {
            polyline: route.geometry,
            distance: route.distance,
            duration: route.duration,
        };
        yield (0, redisClient_1.setCache)(key, result);
        return result;
    });
}
