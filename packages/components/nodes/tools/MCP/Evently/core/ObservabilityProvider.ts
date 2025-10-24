/**
 * ObservabilityProvider - Simple logging and metrics for Evently MCP
 */

interface Metric {
    name: string
    value: number
    timestamp: number
    labels?: Record<string, string>
}

interface LogEntry {
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    timestamp: number
    context?: Record<string, any>
    traceId?: string
}

export class ObservabilityProvider {
    private metrics: Metric[] = []
    private logs: LogEntry[] = []
    private maxMetrics = 1000
    private maxLogs = 1000

    /**
     * Record a metric
     */
    recordMetric(name: string, value: number, labels?: Record<string, string>): void {
        const metric: Metric = {
            name,
            value,
            timestamp: Date.now(),
            labels
        }

        this.metrics.push(metric)

        // Keep only last N metrics
        if (this.metrics.length > this.maxMetrics) {
            this.metrics = this.metrics.slice(-this.maxMetrics)
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'evently-mcp') {
            console.log(`[METRIC] ${name}: ${value}`, labels)
        }
    }

    /**
     * Log a message
     */
    log(level: LogEntry['level'], message: string, context?: Record<string, any>, traceId?: string): void {
        const entry: LogEntry = {
            level,
            message,
            timestamp: Date.now(),
            context,
            traceId
        }

        this.logs.push(entry)

        // Keep only last N logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
        }

        // Console output
        const logMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
        const prefix = `[${level.toUpperCase()}]`
        const traceInfo = traceId ? `[TraceID: ${traceId}]` : ''
        logMethod(`${prefix}${traceInfo} ${message}`, context || '')
    }

    /**
     * Convenience methods
     */
    info(message: string, context?: Record<string, any>, traceId?: string): void {
        this.log('info', message, context, traceId)
    }

    warn(message: string, context?: Record<string, any>, traceId?: string): void {
        this.log('warn', message, context, traceId)
    }

    error(message: string, context?: Record<string, any>, traceId?: string): void {
        this.log('error', message, context, traceId)
    }

    debug(message: string, context?: Record<string, any>, traceId?: string): void {
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'evently-mcp') {
            this.log('debug', message, context, traceId)
        }
    }

    /**
     * Get metrics summary
     */
    getMetricsSummary(): Record<string, { count: number; total: number; avg: number; min: number; max: number }> {
        const summary: Record<string, { count: number; total: number; avg: number; min: number; max: number }> = {}

        this.metrics.forEach((metric) => {
            if (!summary[metric.name]) {
                summary[metric.name] = {
                    count: 0,
                    total: 0,
                    avg: 0,
                    min: Number.MAX_VALUE,
                    max: Number.MIN_VALUE
                }
            }

            const s = summary[metric.name]
            s.count++
            s.total += metric.value
            s.min = Math.min(s.min, metric.value)
            s.max = Math.max(s.max, metric.value)
            s.avg = s.total / s.count
        })

        return summary
    }

    /**
     * Get recent logs
     */
    getRecentLogs(count: number = 100, level?: LogEntry['level']): LogEntry[] {
        let logs = this.logs
        if (level) {
            logs = logs.filter((log) => log.level === level)
        }
        return logs.slice(-count)
    }

    /**
     * Clear all metrics and logs
     */
    clear(): void {
        this.metrics = []
        this.logs = []
    }

    /**
     * Export metrics in Prometheus format
     */
    exportPrometheusMetrics(): string {
        const lines: string[] = []
        const summary = this.getMetricsSummary()

        Object.entries(summary).forEach(([name, stats]) => {
            lines.push(`# HELP ${name} Evently MCP metric`)
            lines.push(`# TYPE ${name} gauge`)
            lines.push(`${name}_count ${stats.count}`)
            lines.push(`${name}_total ${stats.total}`)
            lines.push(`${name}_avg ${stats.avg}`)
            lines.push(`${name}_min ${stats.min}`)
            lines.push(`${name}_max ${stats.max}`)
        })

        return lines.join('\n')
    }
}

// Global singleton instance
let globalObservability: ObservabilityProvider

export function getObservabilityProvider(): ObservabilityProvider {
    if (!globalObservability) {
        globalObservability = new ObservabilityProvider()
    }
    return globalObservability
}

