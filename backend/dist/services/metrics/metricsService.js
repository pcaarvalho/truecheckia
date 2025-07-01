"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
class MetricsService {
    constructor() {
        this.metrics = new Map();
        this.MAX_METRICS_PER_KEY = 1000;
    }
    static getInstance() {
        if (!MetricsService.instance) {
            MetricsService.instance = new MetricsService();
        }
        return MetricsService.instance;
    }
    recordMetric(name, value, tags = {}) {
        const key = this.generateKey(name, tags);
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }
        this.metrics.get(key).push({
            value,
            timestamp: Date.now(),
            tags
        });
        const metrics = this.metrics.get(key);
        if (metrics.length > this.MAX_METRICS_PER_KEY) {
            this.metrics.set(key, metrics.slice(-this.MAX_METRICS_PER_KEY));
        }
    }
    getMetrics(name, tags = {}) {
        const key = this.generateKey(name, tags);
        return this.metrics.get(key) || [];
    }
    getAggregatedMetrics(name, aggregation) {
        const allMetrics = [];
        for (const [key, metrics] of this.metrics.entries()) {
            if (key.startsWith(name)) {
                allMetrics.push(...metrics);
            }
        }
        if (allMetrics.length === 0)
            return 0;
        const values = allMetrics.map(m => typeof m.value === 'number' ? m.value : 0);
        switch (aggregation) {
            case 'sum':
                return values.reduce((a, b) => a + b, 0);
            case 'avg':
                return values.reduce((a, b) => a + b, 0) / values.length;
            case 'min':
                return Math.min(...values);
            case 'max':
                return Math.max(...values);
            case 'count':
                return values.length;
            default:
                return 0;
        }
    }
    getMetricsSummary() {
        const totalMetrics = Array.from(this.metrics.values())
            .reduce((sum, metrics) => sum + metrics.length, 0);
        const topMetrics = Array.from(this.metrics.entries())
            .map(([key, metrics]) => ({ key, count: metrics.length }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalKeys: this.metrics.size,
            totalMetrics,
            memoryUsage: JSON.stringify([...this.metrics.entries()]).length,
            topMetrics
        };
    }
    clearMetrics(name) {
        if (name) {
            for (const key of this.metrics.keys()) {
                if (key.startsWith(name)) {
                    this.metrics.delete(key);
                }
            }
        }
        else {
            this.metrics.clear();
        }
    }
    generateKey(name, tags) {
        const tagStr = Object.entries(tags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}:${v}`)
            .join(',');
        return `${name}${tagStr ? `:${tagStr}` : ''}`;
    }
}
exports.MetricsService = MetricsService;
//# sourceMappingURL=metricsService.js.map