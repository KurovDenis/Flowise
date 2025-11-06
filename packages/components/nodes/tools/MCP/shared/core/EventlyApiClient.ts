import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { AuthManager } from './AuthManager'
import { getObservabilityProvider } from './ObservabilityProvider'

/**
 * Simple rate limiter implementation
 */
class RateLimiter {
    private queue: Array<() => void> = []
    private running = 0

    constructor(private maxConcurrent: number = 10) {}

    async run<T>(fn: () => Promise<T>): Promise<T> {
        while (this.running >= this.maxConcurrent) {
            await new Promise<void>((resolve) => this.queue.push(resolve))
        }

        this.running++
        try {
            return await fn()
        } finally {
            this.running--
            const resolve = this.queue.shift()
            if (resolve) resolve()
        }
    }
}

/**
 * Simple circuit breaker implementation
 */
class CircuitBreaker {
    private failures = 0
    private lastFailureTime = 0
    private state: 'closed' | 'open' | 'half-open' = 'closed'

    constructor(private threshold: number = 5, private resetTimeout: number = 60000) {}

    async execute<T>(fn: () => Promise<T>): Promise<T> {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
                this.state = 'half-open'
            } else {
                throw new Error('Circuit breaker is open')
            }
        }

        try {
            const result = await fn()
            if (this.state === 'half-open') {
                this.state = 'closed'
                this.failures = 0
            }
            return result
        } catch (error) {
            this.failures++
            this.lastFailureTime = Date.now()

            if (this.failures >= this.threshold) {
                this.state = 'open'
            }
            throw error
        }
    }
}

/**
 * EventlyApiClient provides HTTP client with resilience patterns for Evently API
 */
export class EventlyApiClient {
    private axiosInstance: AxiosInstance
    private authManager: AuthManager
    private rateLimiter: RateLimiter
    private circuitBreaker: CircuitBreaker

    constructor(baseUrl: string, authManager: AuthManager) {
        if (!baseUrl || baseUrl.trim() === '') {
            throw new Error('Base URL is required')
        }

        if (!authManager) {
            throw new Error('AuthManager is required')
        }

        this.authManager = authManager

        // Ensure base URL ends with /api for Evently API (remove existing /api to avoid duplication)
        const cleanBaseUrl = baseUrl.replace(/\/api\/?$/, '')
        const apiBaseUrl = `${cleanBaseUrl}/api`

        this.axiosInstance = axios.create({
            baseURL: apiBaseUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        // Setup resilience patterns
        this.rateLimiter = new RateLimiter(10) // Max 10 concurrent requests
        this.circuitBreaker = new CircuitBreaker(5, 60000) // 5 failures, 60s timeout

        // Setup interceptors
        this.setupInterceptors()
        this.setupRetryPolicy()
    }

    /**
     * Setup retry policy with exponential backoff
     */
    private setupRetryPolicy(): void {
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const config = error.config as any

                // Initialize retry count if config exists
                if (config) {
                    config.__retryCount = config.__retryCount || 0
                }

                // Check if should retry
                const shouldRetry = this.shouldRetry(error)
                const maxRetries = 3

                if (shouldRetry && config && config.__retryCount < maxRetries) {
                    config.__retryCount++

                    // Exponential backoff: 1s, 2s, 4s
                    const delay = Math.pow(2, config.__retryCount - 1) * 1000
                    await new Promise((resolve) => setTimeout(resolve, delay))

                    return this.axiosInstance(config)
                }

                // Normalize error message before rejecting
                let errorMessage: string
                if (error.response) {
                    const { status, data } = error.response
                    const responseData = data as any
                    errorMessage = `API Error ${status}: ${responseData?.detail || responseData?.message || 'Unknown error'}`
                } else if (error.request) {
                    errorMessage = 'Network error: Unable to reach Evently API'
                } else {
                    errorMessage = `Request error: ${error.message || 'Unknown error'}`
                }

                return Promise.reject(new Error(errorMessage))
            }
        )
    }

    /**
     * Determine if request should be retried
     */
    private shouldRetry(error: AxiosError): boolean {
        // Don't retry if there's no config
        if (!error.config) return false

        // Retry on network errors
        if (!error.response) return true

        // Retry on 5xx errors
        if (error.response.status >= 500 && error.response.status < 600) {
            return true
        }

        // Retry on 429 (rate limit)
        if (error.response.status === 429) {
            return true
        }

        return false
    }

    /**
     * Setup request interceptors for authentication
     */
    private setupInterceptors(): void {
        // Request interceptor to add JWT token
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                try {
                    const token = await this.authManager.getToken()
                    config.headers.Authorization = `Bearer ${token}`
                } catch (error: any) {
                    const errorMessage = error?.message || 'Unknown authentication error'
                    throw new Error(`Authentication failed: ${errorMessage}`)
                }
                return config
            },
            (error) => Promise.reject(error)
        )
    }

    /**
     * GET request with rate limiting and circuit breaker
     */
    async get<T>(path: string, params?: any): Promise<T> {
        const observability = getObservabilityProvider()
        const startTime = Date.now()

        try {
            const result = await this.rateLimiter.run(async () => {
                return this.circuitBreaker.execute(async () => {
                    const response: AxiosResponse<T> = await this.axiosInstance.get(path, { params })
                    return response.data
                })
            })

            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'GET',
                path,
                status: 'success'
            })
            observability.debug(`GET ${path} completed in ${duration}ms`)

            return result
        } catch (error: any) {
            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'GET',
                path,
                status: 'error'
            })
            observability.recordMetric('evently_api_errors_total', 1, { method: 'GET', path })
            observability.error(`GET ${path} failed after ${duration}ms`, {
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
    }

    /**
     * POST request with rate limiting and circuit breaker
     */
    async post<T>(path: string, data: any): Promise<T> {
        const observability = getObservabilityProvider()
        const startTime = Date.now()

        try {
            const result = await this.rateLimiter.run(async () => {
                return this.circuitBreaker.execute(async () => {
                    const response: AxiosResponse<T> = await this.axiosInstance.post(path, data)
                    return response.data
                })
            })

            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'POST',
                path,
                status: 'success'
            })
            observability.debug(`POST ${path} completed in ${duration}ms`)

            return result
        } catch (error: any) {
            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'POST',
                path,
                status: 'error'
            })
            observability.recordMetric('evently_api_errors_total', 1, { method: 'POST', path })
            observability.error(`POST ${path} failed after ${duration}ms`, {
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
    }

    /**
     * PUT request with rate limiting and circuit breaker
     */
    async put<T>(path: string, data: any): Promise<T> {
        const observability = getObservabilityProvider()
        const startTime = Date.now()

        try {
            const result = await this.rateLimiter.run(async () => {
                return this.circuitBreaker.execute(async () => {
                    const response: AxiosResponse<T> = await this.axiosInstance.put(path, data)
                    return response.data
                })
            })

            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'PUT',
                path,
                status: 'success'
            })
            observability.debug(`PUT ${path} completed in ${duration}ms`)

            return result
        } catch (error: any) {
            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'PUT',
                path,
                status: 'error'
            })
            observability.recordMetric('evently_api_errors_total', 1, { method: 'PUT', path })
            observability.error(`PUT ${path} failed after ${duration}ms`, {
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
    }

    /**
     * DELETE request with rate limiting and circuit breaker
     */
    async delete<T>(path: string): Promise<T> {
        const observability = getObservabilityProvider()
        const startTime = Date.now()

        try {
            const result = await this.rateLimiter.run(async () => {
                return this.circuitBreaker.execute(async () => {
                    const response: AxiosResponse<T> = await this.axiosInstance.delete(path)
                    return response.data
                })
            })

            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'DELETE',
                path,
                status: 'success'
            })
            observability.debug(`DELETE ${path} completed in ${duration}ms`)

            return result
        } catch (error: any) {
            const duration = Date.now() - startTime
            observability.recordMetric('evently_api_request_duration_ms', duration, {
                method: 'DELETE',
                path,
                status: 'error'
            })
            observability.recordMetric('evently_api_errors_total', 1, { method: 'DELETE', path })
            observability.error(`DELETE ${path} failed after ${duration}ms`, {
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
    }
}

