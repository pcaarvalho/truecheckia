"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const logger_1 = require("../../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class CacheService {
    constructor() {
        this.cache = new Map();
        this.DEFAULT_TTL = 3600000;
        setInterval(() => this.cleanExpiredCache(), 300000);
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    generateKey(data) {
        return crypto_1.default.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
    set(key, data, ttl = this.DEFAULT_TTL) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl
        });
        logger_1.logger.debug(`Cache set for key: ${key.substring(0, 8)}...`);
    }
    get(key) {
        const cached = this.cache.get(key);
        if (!cached)
            return null;
        if (Date.now() > cached.expiry) {
            this.cache.delete(key);
            return null;
        }
        logger_1.logger.debug(`Cache hit for key: ${key.substring(0, 8)}...`);
        return cached.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        return {
            size: this.cache.size,
            memoryUsage: JSON.stringify([...this.cache.entries()]).length
        };
    }
    cleanExpiredCache() {
        const now = Date.now();
        let deletedCount = 0;
        for (const [key, value] of this.cache.entries()) {
            if (now > value.expiry) {
                this.cache.delete(key);
                deletedCount++;
            }
        }
        if (deletedCount > 0) {
            logger_1.logger.debug(`Cleaned ${deletedCount} expired cache entries`);
        }
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=cacheService.js.map