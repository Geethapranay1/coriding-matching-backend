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
exports.setCache = exports.getCache = void 0;
const redis_1 = require("redis");
const client = (0, redis_1.createClient)({ url: process.env.REDIS_URL });
client.on('error', (err) => console.error('redis err', err));
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield client.connect();
        console.log('redis ok');
    }
    catch (error) {
        console.error('redis fail', error);
    }
}))();
const getCache = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const val = yield client.get(key);
    return val ? JSON.parse(val) : null;
});
exports.getCache = getCache;
const setCache = (key_1, value_1, ...args_1) => __awaiter(void 0, [key_1, value_1, ...args_1], void 0, function* (key, value, ttl = 3600) {
    yield client.set(key, JSON.stringify(value), { EX: ttl });
});
exports.setCache = setCache;
exports.default = client;
