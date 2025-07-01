export declare class MetricsService {
    private static instance;
    private metrics;
    private readonly MAX_METRICS_PER_KEY;
    private constructor();
    static getInstance(): MetricsService;
    recordMetric(name: string, value: any, tags?: Record<string, string>): void;
    getMetrics(name: string, tags?: Record<string, string>): any[];
    getAggregatedMetrics(name: string, aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'): number;
    getMetricsSummary(): {
        totalKeys: number;
        totalMetrics: number;
        memoryUsage: number;
        topMetrics: Array<{
            key: string;
            count: number;
        }>;
    };
    clearMetrics(name?: string): void;
    private generateKey;
}
//# sourceMappingURL=metricsService.d.ts.map