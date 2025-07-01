"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const router = (0, express_1.Router)();
router.get('/health', async (_req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        timestamp: Date.now(),
        status: 'ok',
        checks: {
            database: 'ok',
            redis: 'ok',
            memory: process.memoryUsage(),
        }
    };
    try {
        await database_1.prisma.$queryRaw `SELECT 1`;
    }
    catch (error) {
        healthcheck.status = 'error';
        healthcheck.checks.database = 'error';
    }
    try {
        if (redis_1.redis) {
            await redis_1.redis.ping();
        }
        else {
            healthcheck.checks.redis = 'not_configured';
        }
    }
    catch (error) {
        healthcheck.status = 'error';
        healthcheck.checks.redis = 'error';
    }
    const statusCode = healthcheck.status === 'ok' ? 200 : 503;
    return res.status(statusCode).json(healthcheck);
});
exports.default = router;
//# sourceMappingURL=health.js.map