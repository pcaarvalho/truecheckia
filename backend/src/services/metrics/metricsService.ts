export class MetricsService {
  private static instance: MetricsService;
  private metrics: Map<string, any[]> = new Map();
  private readonly MAX_METRICS_PER_KEY = 1000;

  private constructor() {}

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  recordMetric(name: string, value: any, tags: Record<string, string> = {}): void {
    const key = this.generateKey(name, tags);
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    this.metrics.get(key)!.push({
      value,
      timestamp: Date.now(),
      tags
    });

    // Mantém apenas últimas métricas por chave
    const metrics = this.metrics.get(key)!;
    if (metrics.length > this.MAX_METRICS_PER_KEY) {
      this.metrics.set(key, metrics.slice(-this.MAX_METRICS_PER_KEY));
    }
  }

  getMetrics(name: string, tags: Record<string, string> = {}): any[] {
    const key = this.generateKey(name, tags);
    return this.metrics.get(key) || [];
  }

  getAggregatedMetrics(name: string, aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count'): number {
    const allMetrics: any[] = [];
    
    for (const [key, metrics] of this.metrics.entries()) {
      if (key.startsWith(name)) {
        allMetrics.push(...metrics);
      }
    }

    if (allMetrics.length === 0) return 0;

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

  getMetricsSummary(): { 
    totalKeys: number; 
    totalMetrics: number; 
    memoryUsage: number;
    topMetrics: Array<{ key: string; count: number }>;
  } {
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

  clearMetrics(name?: string): void {
    if (name) {
      // Remove métricas específicas
      for (const key of this.metrics.keys()) {
        if (key.startsWith(name)) {
          this.metrics.delete(key);
        }
      }
    } else {
      // Remove todas as métricas
      this.metrics.clear();
    }
  }

  private generateKey(name: string, tags: Record<string, string>): string {
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}${tagStr ? `:${tagStr}` : ''}`;
  }
} 