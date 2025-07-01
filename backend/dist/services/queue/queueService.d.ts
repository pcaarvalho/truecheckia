import { EventEmitter } from 'events';
import { QueueJob } from '../../types/detection.types';
export declare class QueueService extends EventEmitter {
    private static instance;
    private queue;
    private processing;
    private concurrency;
    private activeJobs;
    private constructor();
    static getInstance(): QueueService;
    addJob<T>(data: T, options?: {
        priority?: number;
        maxRetries?: number;
    }): Promise<string>;
    private processQueue;
    private processJob;
    completeJob(jobId: string, result: any): void;
    failJob(jobId: string, error: Error): void;
    getJob(jobId: string): QueueJob | undefined;
    getQueueStatus(): {
        pending: number;
        processing: number;
        activeJobs: number;
        totalJobs: number;
    };
    clearQueue(): void;
    private generateJobId;
}
//# sourceMappingURL=queueService.d.ts.map