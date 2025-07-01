export declare class CacheService {
    private static instance;
    private cache;
    private readonly DEFAULT_TTL;
    private constructor();
    static getInstance(): CacheService;
    generateKey(data: any): string;
    set(key: string, data: any, ttl?: number): void;
    get(key: string): any | null;
    delete(key: string): void;
    clear(): void;
    getStats(): {
        size: number;
        memoryUsage: number;
    };
    private cleanExpiredCache;
}
//# sourceMappingURL=cacheService.d.ts.map