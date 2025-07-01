export declare const createRateLimiter: (options: {
    windowMs?: number;
    max?: number;
    prefix?: string;
}) => import("express-rate-limit").RateLimitRequestHandler;
export declare const authLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const apiLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const uploadLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const devBypassLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const smartAuthLimiter: import("express-rate-limit").RateLimitRequestHandler;
export declare const smartApiLimiter: import("express-rate-limit").RateLimitRequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map