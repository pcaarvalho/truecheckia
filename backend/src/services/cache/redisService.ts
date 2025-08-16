import Redis from 'ioredis';
import { logger } from '../../utils/logger';

export class RedisService {
  private static instance: RedisService;
  private client: Redis | null = null;
  private connected = false;
  private retryCount = 0;
  private readonly maxRetries = 5;

  private constructor() {}

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  async connect(): Promise<void> {
    if (this.connected && this.client) return;

    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 1000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        db: parseInt(process.env.REDIS_DB || '0'),
        keyPrefix: process.env.REDIS_PREFIX || 'truecheckia:',
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          return err.message.includes(targetError);
        },
      });

      // Event listeners
      this.client.on('connect', () => {
        logger.info('Redis connecting...');
      });

      this.client.on('ready', () => {
        this.connected = true;
        this.retryCount = 0;
        logger.info('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.connected = false;
        logger.error('Redis error:', error);

        // Implementa backoff exponencial
        this.retryCount++;
        if (this.retryCount <= this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);
          setTimeout(() => this.connect(), delay);
        }
      });

      this.client.on('close', () => {
        this.connected = false;
        logger.warn('Redis connection closed');
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.connect();

      // Testa conexão
      const pong = await this.client.ping();
      if (pong !== 'PONG') {
        throw new Error('Redis ping failed');
      }
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.connected = false;
      logger.info('Redis disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!this.isConnected()) {
      logger.warn('Redis not connected, skipping set operation');
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);

      if (ttl) {
        await this.client!.setex(key, ttl, serializedValue);
      } else {
        await this.client!.set(key, serializedValue);
      }

      logger.debug(`Redis SET: ${key} (TTL: ${ttl || 'none'})`);
      return true;
    } catch (error) {
      logger.error(`Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    if (!this.isConnected()) {
      logger.warn('Redis not connected, skipping get operation');
      return null;
    }

    try {
      const value = await this.client!.get(key);

      if (value === null) {
        return null;
      }

      const parsed = JSON.parse(value);
      logger.debug(`Redis GET: ${key} (found)`);
      return parsed;
    } catch (error) {
      logger.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      logger.warn('Redis not connected, skipping delete operation');
      return false;
    }

    try {
      const result = await this.client!.del(key);
      logger.debug(`Redis DELETE: ${key} (${result} keys deleted)`);
      return result > 0;
    } catch (error) {
      logger.error(`Redis DELETE error for key ${key}:`, error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const result = await this.client!.expire(key, ttl);
      return result === 1;
    } catch (error) {
      logger.error(`Redis EXPIRE error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, value: number = 1): Promise<number | null> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const result = await this.client!.incrby(key, value);
      return result;
    } catch (error) {
      logger.error(`Redis INCREMENT error for key ${key}:`, error);
      return null;
    }
  }

  async setHash(key: string, field: string, value: any): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const serializedValue = JSON.stringify(value);
      await this.client!.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async getHash<T = any>(key: string, field: string): Promise<T | null> {
    if (!this.isConnected()) {
      return null;
    }

    try {
      const value = await this.client!.hget(key, field);

      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
      return null;
    }
  }

  async deleteHash(key: string, field: string): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      const result = await this.client!.hdel(key, field);
      return result > 0;
    } catch (error) {
      logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
      return false;
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    if (!this.isConnected()) {
      return 0;
    }

    try {
      const keys = await this.client!.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      const result = await this.client!.del(...keys);
      logger.info(`Redis cleared ${result} keys matching pattern: ${pattern}`);
      return result;
    } catch (error) {
      logger.error(`Redis CLEAR PATTERN error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  async getStats(): Promise<{
    connected: boolean;
    memory: string;
    keys: number;
    uptime: number;
  }> {
    if (!this.isConnected()) {
      return {
        connected: false,
        memory: '0',
        keys: 0,
        uptime: 0,
      };
    }

    try {
      const info = await this.client!.info('memory');
      const dbsize = await this.client!.dbsize();
      const uptime = await this.client!.info('server');

      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const uptimeMatch = uptime.match(/uptime_in_seconds:(\d+)/);

      return {
        connected: true,
        memory: memoryMatch ? memoryMatch[1].trim() : '0',
        keys: dbsize,
        uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0,
      };
    } catch (error) {
      logger.error('Redis STATS error:', error);
      return {
        connected: false,
        memory: '0',
        keys: 0,
        uptime: 0,
      };
    }
  }

  async flushAll(): Promise<boolean> {
    if (!this.isConnected()) {
      return false;
    }

    try {
      await this.client!.flushall();
      logger.warn('Redis FLUSHALL executed - all data cleared');
      return true;
    } catch (error) {
      logger.error('Redis FLUSHALL error:', error);
      return false;
    }
  }

  // Método de saúde para health checks
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency?: number }> {
    if (!this.isConnected()) {
      return { status: 'unhealthy' };
    }

    try {
      const start = Date.now();
      await this.client!.ping();
      const latency = Date.now() - start;

      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return { status: 'unhealthy' };
    }
  }
}

// Instância singleton
export const redisService = RedisService.getInstance();
