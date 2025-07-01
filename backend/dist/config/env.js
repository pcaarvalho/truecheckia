"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']),
    PORT: zod_1.z.string().transform(Number).default('5000'),
    DATABASE_URL: zod_1.z.string().url(),
    REDIS_URL: zod_1.z.string().url(),
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('1h'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('7d'),
    MINIO_ENDPOINT: zod_1.z.string().optional(),
    MINIO_PORT: zod_1.z.string().transform(Number).optional(),
    MINIO_ACCESS_KEY: zod_1.z.string().optional(),
    MINIO_SECRET_KEY: zod_1.z.string().optional(),
    MINIO_BUCKET: zod_1.z.string().optional(),
    MINIO_USE_SSL: zod_1.z.string().transform(Boolean).optional(),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX: zod_1.z.string().transform(Number).default('100'),
    ANTHROPIC_API_KEY: zod_1.z.string().min(1),
});
exports.env = envSchema.parse(process.env);
//# sourceMappingURL=env.js.map