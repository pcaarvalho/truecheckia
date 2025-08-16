import Bull, { Queue, Job, JobOptions } from 'bull';
import { logger } from '../../utils/logger';
import { redisService } from '../cache/redisService';

export interface QueueJobData {
  type: 'text' | 'video' | 'email' | 'report';
  data: any;
  userId?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export class BullQueueService {
  private static instance: BullQueueService;
  private queues: Map<string, Queue> = new Map();
  private processors: Map<string, (job: Job<QueueJobData>) => Promise<any>> = new Map();
  private connected = false;

  private constructor() {}

  static getInstance(): BullQueueService {
    if (!BullQueueService.instance) {
      BullQueueService.instance = new BullQueueService();
    }
    return BullQueueService.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Verifica se Redis está disponível
      if (!redisService.isConnected()) {
        await redisService.connect();
      }

      const redisConfig = {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          db: parseInt(process.env.REDIS_DB || '1'), // DB diferente do cache
          password: process.env.REDIS_PASSWORD,
          keyPrefix: process.env.REDIS_QUEUE_PREFIX || 'bull:',
          maxRetriesPerRequest: 3,
          retryDelayOnFailover: 1000,
          lazyConnect: true,
        },
        defaultJobOptions: {
          removeOnComplete: 50, // Mantém últimos 50 jobs completos
          removeOnFail: 100, // Mantém últimos 100 jobs falhos
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        } as JobOptions,
      };

      // Cria filas específicas
      await this.createQueue('analysis', redisConfig);
      await this.createQueue('email', redisConfig);
      await this.createQueue('reports', redisConfig);
      await this.createQueue('cleanup', redisConfig);

      this.connected = true;
      logger.info('Bull Queue Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Bull Queue Service:', error);
      throw error;
    }
  }

  private async createQueue(name: string, config: any): Promise<void> {
    const queue = new Bull(name, config);

    // Event listeners para monitoramento
    queue.on('ready', () => {
      logger.info(`Queue ${name} is ready`);
    });

    queue.on('error', (error) => {
      logger.error(`Queue ${name} error:`, error);
    });

    queue.on('waiting', (jobId) => {
      logger.debug(`Job ${jobId} is waiting in queue ${name}`);
    });

    queue.on('active', (job) => {
      logger.info(`Job ${job.id} started processing in queue ${name}`, {
        jobType: job.data.type,
        userId: job.data.userId,
      });
    });

    queue.on('completed', (job, _result) => {
      logger.info(`Job ${job.id} completed in queue ${name}`, {
        jobType: job.data.type,
        userId: job.data.userId,
        processingTime: Date.now() - job.processedOn!,
      });
    });

    queue.on('failed', (job, error) => {
      logger.error(`Job ${job.id} failed in queue ${name}:`, error, {
        jobType: job.data.type,
        userId: job.data.userId,
        attempts: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled in queue ${name}`, {
        jobType: job.data.type,
        userId: job.data.userId,
      });
    });

    this.queues.set(name, queue);
  }

  async addJob(
    queueName: string,
    jobData: QueueJobData,
    options: JobOptions = {}
  ): Promise<string> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    try {
      const job = await queue.add(jobData.type, jobData, {
        priority: jobData.priority || 0,
        delay: options.delay || 0,
        attempts: options.attempts || 3,
        backoff: options.backoff || { type: 'exponential', delay: 2000 },
        removeOnComplete: options.removeOnComplete || 50,
        removeOnFail: options.removeOnFail || 100,
        ...options,
      });

      logger.info(`Job ${job.id} added to queue ${queueName}`, {
        jobType: jobData.type,
        userId: jobData.userId,
        priority: jobData.priority,
      });

      return job.id.toString();
    } catch (error) {
      logger.error(`Failed to add job to queue ${queueName}:`, error);
      throw error;
    }
  }

  registerProcessor(
    queueName: string,
    jobType: string,
    processor: (job: Job<QueueJobData>) => Promise<any>,
    concurrency: number = 1
  ): void {
    const queue = this.queues.get(queueName);

    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const processorKey = `${queueName}:${jobType}`;
    this.processors.set(processorKey, processor);

    queue.process(jobType, concurrency, async (job: Job<QueueJobData>) => {
      const startTime = Date.now();

      try {
        logger.info(`Processing job ${job.id} of type ${jobType}`, {
          userId: job.data.userId,
          queueName,
          attempt: job.attemptsMade + 1,
        });

        const result = await processor(job);

        const processingTime = Date.now() - startTime;
        logger.info(`Job ${job.id} processed successfully`, {
          jobType,
          userId: job.data.userId,
          processingTime,
        });

        return result;
      } catch (error) {
        const processingTime = Date.now() - startTime;
        logger.error(`Job ${job.id} processing failed:`, error, {
          jobType,
          userId: job.data.userId,
          processingTime,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
        });

        throw error;
      }
    });

    logger.info(`Registered processor for ${queueName}:${jobType} with concurrency ${concurrency}`);
  }

  async getJob(queueName: string, jobId: string): Promise<Job | null> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return null;
    }

    try {
      return await queue.getJob(jobId);
    } catch (error) {
      logger.error(`Failed to get job ${jobId} from queue ${queueName}:`, error);
      return null;
    }
  }

  async getQueueStats(queueName: string): Promise<QueueStats | null> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return null;
    }

    try {
      const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed(),
        queue.getPaused(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        paused: paused.length,
      };
    } catch (error) {
      logger.error(`Failed to get stats for queue ${queueName}:`, error);
      return null;
    }
  }

  async getAllQueueStats(): Promise<Record<string, QueueStats>> {
    const stats: Record<string, QueueStats> = {};

    for (const [queueName] of this.queues) {
      const queueStats = await this.getQueueStats(queueName);
      if (queueStats) {
        stats[queueName] = queueStats;
      }
    }

    return stats;
  }

  async pauseQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return false;
    }

    try {
      await queue.pause();
      logger.info(`Queue ${queueName} paused`);
      return true;
    } catch (error) {
      logger.error(`Failed to pause queue ${queueName}:`, error);
      return false;
    }
  }

  async resumeQueue(queueName: string): Promise<boolean> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return false;
    }

    try {
      await queue.resume();
      logger.info(`Queue ${queueName} resumed`);
      return true;
    } catch (error) {
      logger.error(`Failed to resume queue ${queueName}:`, error);
      return false;
    }
  }

  async cleanQueue(
    queueName: string,
    grace: number = 5000,
    status: 'completed' | 'failed' | 'active' | 'waiting' = 'completed'
  ): Promise<number> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return 0;
    }

    try {
      const jobs = await queue.clean(grace, status);
      logger.info(`Cleaned ${jobs.length} ${status} jobs from queue ${queueName}`);
      return jobs.length;
    } catch (error) {
      logger.error(`Failed to clean queue ${queueName}:`, error);
      return 0;
    }
  }

  async retryFailedJobs(queueName: string, limit: number = 100): Promise<number> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return 0;
    }

    try {
      const failedJobs = await queue.getFailed(0, limit - 1);
      let retried = 0;

      for (const job of failedJobs) {
        try {
          await job.retry();
          retried++;
        } catch (error) {
          logger.error(`Failed to retry job ${job.id}:`, error);
        }
      }

      logger.info(`Retried ${retried} failed jobs in queue ${queueName}`);
      return retried;
    } catch (error) {
      logger.error(`Failed to retry jobs in queue ${queueName}:`, error);
      return 0;
    }
  }

  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);

    if (!queue) {
      return false;
    }

    try {
      const job = await queue.getJob(jobId);

      if (job) {
        await job.remove();
        logger.info(`Job ${jobId} removed from queue ${queueName}`);
        return true;
      }

      return false;
    } catch (error) {
      logger.error(`Failed to remove job ${jobId} from queue ${queueName}:`, error);
      return false;
    }
  }

  async close(): Promise<void> {
    for (const [queueName, queue] of this.queues) {
      try {
        await queue.close();
        logger.info(`Queue ${queueName} closed`);
      } catch (error) {
        logger.error(`Failed to close queue ${queueName}:`, error);
      }
    }

    this.queues.clear();
    this.processors.clear();
    this.connected = false;
    logger.info('Bull Queue Service closed');
  }

  isConnected(): boolean {
    return this.connected;
  }

  getAvailableQueues(): string[] {
    return Array.from(this.queues.keys());
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    queues: Record<string, boolean>;
  }> {
    const queueStatus: Record<string, boolean> = {};
    let allHealthy = true;

    for (const [queueName, queue] of this.queues) {
      try {
        // Testa se a fila está respondendo
        await queue.getJobCounts();
        queueStatus[queueName] = true;
      } catch (error) {
        queueStatus[queueName] = false;
        allHealthy = false;
        logger.error(`Health check failed for queue ${queueName}:`, error);
      }
    }

    return {
      status: allHealthy && this.connected ? 'healthy' : 'unhealthy',
      queues: queueStatus,
    };
  }
}

// Instância singleton
export const bullQueueService = BullQueueService.getInstance();
