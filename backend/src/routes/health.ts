import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
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
    // Check database
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.checks.database = 'error';
  }

  try {
    // Check Redis
    if (redis) {
      await redis.ping();
    } else {
      healthcheck.checks.redis = 'not_configured';
    }
  } catch (error) {
    healthcheck.status = 'error';
    healthcheck.checks.redis = 'error';
  }

  const statusCode = healthcheck.status === 'ok' ? 200 : 503;
  return res.status(statusCode).json(healthcheck);
});

export default router; 