import Redis from 'ioredis'

/**
 * Cache provider interface for Evently MCP
 */
interface ICacheProvider {
    get(key: string): Promise<any | undefined>
    set(key: string, value: any, ttlSeconds: number): Promise<void>
}

/**
 * In-memory cache provider using Map with TTL support
 */
class InMemoryCacheProvider implements ICacheProvider {
    private cache = new Map<string, { value: any; expires: number }>()

    async get(key: string): Promise<any | undefined> {
        const item = this.cache.get(key)
        if (!item) {
            return undefined
        }

        if (Date.now() > item.expires) {
            this.cache.delete(key)
            return undefined
        }

        return item.value
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        const expires = Date.now() + ttlSeconds * 1000
        this.cache.set(key, { value, expires })
    }
}

/**
 * Redis cache provider using ioredis
 */
class RedisCacheProvider implements ICacheProvider {
    private redis: Redis

    constructor(redisUrl: string) {
        this.redis = new Redis(redisUrl)
    }

    async get(key: string): Promise<any | undefined> {
        const value = await this.redis.get(key)
        return value ? JSON.parse(value) : undefined
    }

    async set(key: string, value: any, ttlSeconds: number): Promise<void> {
        await this.redis.setex(key, ttlSeconds, JSON.stringify(value))
    }
}

/**
 * Factory function to create appropriate cache provider
 */
export function createCacheProvider(): ICacheProvider {
    return process.env.MODE === 'QUEUE'
        ? new RedisCacheProvider(process.env.REDIS_URL || 'redis://localhost:6379')
        : new InMemoryCacheProvider()
}
