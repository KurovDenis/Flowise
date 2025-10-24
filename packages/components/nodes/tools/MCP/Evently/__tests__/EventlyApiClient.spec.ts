import { EventlyApiClient } from '../core/EventlyApiClient'
import { AuthManager } from '../core/AuthManager'

describe('EventlyApiClient', () => {
    let authManager: AuthManager

    beforeEach(() => {
        authManager = new AuthManager('test-jwt-token')
    })

    it('should create client with base URL', () => {
        const client = new EventlyApiClient('http://localhost:5000', authManager)
        expect(client).toBeDefined()
    })

    it('should throw error if base URL is empty', () => {
        expect(() => new EventlyApiClient('', authManager)).toThrow('Base URL is required')
    })

    it('should throw error if auth manager is null', () => {
        expect(() => new EventlyApiClient('http://localhost:5000', null as any)).toThrow('AuthManager is required')
    })

    it('should have rate limiter configured', () => {
        const client = new EventlyApiClient('http://localhost:5000', authManager)
        expect(client).toBeDefined()
        // Note: Internal rate limiter testing will be added when implementation is complete
    })
})
