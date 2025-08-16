import { logger } from '../../utils/logger';
import crypto from 'crypto';

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private readonly DEFAULT_TTL = 3600000; // 1 hora

  private constructor() {
    // Limpa cache expirado a cada 5 minutos
    setInterval(() => this.cleanExpiredCache(), 300000);
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  generateKey(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
    });
    logger.debug(`Cache set for key: ${key.substring(0, 8)}...`);
  }

  get(key: string): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`Cache hit for key: ${key.substring(0, 8)}...`);
    return cached.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; memoryUsage: number } {
    return {
      size: this.cache.size,
      memoryUsage: JSON.stringify([...this.cache.entries()]).length,
    };
  }

  private cleanExpiredCache(): void {
    const now = Date.now();
    let deletedCount = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.debug(`Cleaned ${deletedCount} expired cache entries`);
    }
  }
}
