"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const logger_1 = require("../../utils/logger");
const events_1 = require("events");
class QueueService extends events_1.EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.processing = false;
        this.concurrency = 3;
        this.activeJobs = 0;
        this.setMaxListeners(100);
    }
    static getInstance() {
        if (!QueueService.instance) {
            QueueService.instance = new QueueService();
        }
        return QueueService.instance;
    }
    async addJob(data, options = {}) {
        const job = {
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
        logger_1.logger.info(`Job ${job.id} added to queue with priority ${job.priority}`);
        this.emit('job:added', job);
        if (!this.processing) {
            this.processQueue();
        }
        return job.id;
    }
    async processQueue() {
        if (this.processing || this.activeJobs >= this.concurrency)
            return;
        this.processing = true;
        while (this.queue.length > 0 && this.activeJobs < this.concurrency) {
            const job = this.queue.find(j => j.status === 'pending');
            if (!job)
                break;
            this.activeJobs++;
            this.processJob(job).catch(error => {
                logger_1.logger.error(`Error processing job ${job.id}:`, error);
            }).finally(() => {
                this.activeJobs--;
            });
        }
        this.processing = false;
        if (this.queue.some(j => j.status === 'pending')) {
            setTimeout(() => this.processQueue(), 100);
        }
    }
    async processJob(job) {
        try {
            job.status = 'processing';
            job.processingStartedAt = new Date();
            this.emit('job:processing', job);
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Job ${job.id} timeout`));
                }, 30000);
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
            this.queue = this.queue.filter(j => j.id !== job.id);
        }
        catch (error) {
            job.error = error;
            job.retries++;
            if (job.retries < job.maxRetries) {
                job.status = 'pending';
                logger_1.logger.warn(`Job ${job.id} failed, retrying (${job.retries}/${job.maxRetries})`);
                this.emit('job:retry', job);
            }
            else {
                job.status = 'failed';
                logger_1.logger.error(`Job ${job.id} failed after ${job.maxRetries} retries`);
                this.emit('job:failed', job);
                this.queue = this.queue.filter(j => j.id !== job.id);
            }
        }
    }
    completeJob(jobId, result) {
        this.emit(`job:${jobId}:complete`, result);
    }
    failJob(jobId, error) {
        this.emit(`job:${jobId}:error`, error);
    }
    getJob(jobId) {
        return this.queue.find(j => j.id === jobId);
    }
    getQueueStatus() {
        return {
            pending: this.queue.filter(j => j.status === 'pending').length,
            processing: this.queue.filter(j => j.status === 'processing').length,
            activeJobs: this.activeJobs,
            totalJobs: this.queue.length
        };
    }
    clearQueue() {
        this.queue = [];
        this.activeJobs = 0;
        this.processing = false;
        logger_1.logger.info('Queue cleared');
    }
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.QueueService = QueueService;
//# sourceMappingURL=queueService.js.map