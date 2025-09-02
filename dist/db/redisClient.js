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
exports.getCache = getCache;
exports.setCache = setCache;
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
client.on('error', (err) => console.error('Redis Error', err));
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.connect();
            console.log("Redis connected");
        }
        catch (error) {
            console.error("Redis connection failed", error);
        }
    });
}
init();
function getCache(key) {
    return __awaiter(this, void 0, void 0, function* () {
        const val = yield client.get(key);
        return val ? JSON.parse(val) : null;
    });
}
function setCache(key_1, value_1) {
    return __awaiter(this, arguments, void 0, function* (key, value, ttl = 3600) {
        yield client.set(key, JSON.stringify(value), { EX: ttl });
    });
}
exports.default = client;
