import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import { QueueJob } from '../../types/detection.types';

export class QueueService extends EventEmitter {
  private static instance: QueueService;
  private queue: QueueJob[] = [];
  private processing = false;
  private concurrency = 3;
  private activeJobs = 0;

  private constructor() {
    super();
    this.setMaxListeners(100); // Evita warning de memory leak
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  async addJob<T>(data: T, options: { priority?: number; maxRetries?: number } = {}): Promise<string> {
    const job: QueueJob<T> = {
      id: this.generateJobId(),
      data,
      priority: options.priority || 1,
      retries: 0,
      maxRetries: options.maxRetries || 3,
      createdAt: new Date(),
      status: 'pending'
    };

    this.queue.push(job);
    this.queue.sort((a, b) => b.priority - a.priority);

    logger.info(`Job ${job.id} added to queue with priority ${job.priority}`);
    this.emit('job:added', job);

    if (!this.processing) {
      this.processQueue();
    }

    return job.id;
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeJobs >= this.concurrency) return;

    this.processing = true;

    while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
      const job = this.queue.find(j => j.status === 'pending');
      if (!job) break;

      this.activeJobs++;
      this.processJob(job).catch(error => {
        logger.error(`Error processing job ${job.id}:`, error);
      }).finally(() => {
        this.activeJobs--;
      });
    }

    this.processing = false;

    // Reprocessa se ainda houver jobs pendentes
    if (this.queue.some(j => j.status === 'pending')) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  private async processJob(job: QueueJob): Promise<void> {
    try {
      job.status = 'processing';
      job.processingStartedAt = new Date();
      this.emit('job:processing', job);

      // Processamento será implementado pelos listeners
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Job ${job.id} timeout`));
        }, 30000); // 30s timeout

        this.once(`job:${job.id}:complete`, () => {
          clearTimeout(timeout);
          resolve();
        });
        
        this.once(`job:${job.id}:error`, (error) => {
          clearTimeout(timeout);
          reject(error);
        });
        
        this.emit('job:process', job);
      });

      job.status = 'completed';
      job.completedAt = new Date();
      this.emit('job:completed', job);

      // Remove job da fila após conclusão
      this.queue = this.queue.filter(j => j.id !== job.id);

    } catch (error) {
      job.error = error as Error;
      job.retries++;

      if (job.retries < job.maxRetries) {
        job.status = 'pending';
        logger.warn(`Job ${job.id} failed, retrying (${job.retries}/${job.maxRetries})`);
        this.emit('job:retry', job);
      } else {
        job.status = 'failed';
        logger.error(`Job ${job.id} failed after ${job.maxRetries} retries`);
        this.emit('job:failed', job);
        this.queue = this.queue.filter(j => j.id !== job.id);
      }
    }
  }

  completeJob(jobId: string, result: any): void {
    this.emit(`job:${jobId}:complete`, result);
  }

  failJob(jobId: string, error: Error): void {
    this.emit(`job:${jobId}:error`, error);
  }

  getJob(jobId: string): QueueJob | undefined {
    return this.queue.find(j => j.id === jobId);
  }

  getQueueStatus(): { pending: number; processing: number; activeJobs: number; totalJobs: number } {
    return {
      pending: this.queue.filter(j => j.status === 'pending').length,
      processing: this.queue.filter(j => j.status === 'processing').length,
      activeJobs: this.activeJobs,
      totalJobs: this.queue.length
    };
  }

  clearQueue(): void {
    this.queue = [];
    this.activeJobs = 0;
    this.processing = false;
    logger.info('Queue cleared');
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 