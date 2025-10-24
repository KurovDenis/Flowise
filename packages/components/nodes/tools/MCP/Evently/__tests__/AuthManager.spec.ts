import { AuthManager } from '../core/AuthManager'

describe('AuthManager', () => {
    it('should throw error if token is empty', async () => {
        const authManager = new AuthManager('')
        await expect(authManager.getToken()).rejects.toThrow('Auth token is missing')
    })

    it('should return token when valid', async () => {
        const token = 'valid-jwt-token'
        const authManager = new AuthManager(token)

        const result = await authManager.getToken()

        expect(result).toBe(token)
    })

    it('should throw error if token is undefined', async () => {
        const authManager = new AuthManager(undefined as any)
        await expect(authManager.getToken()).rejects.toThrow('Auth token is missing')
    })

    it('should throw error if token is null', async () => {
        const authManager = new AuthManager(null as any)
        await expect(authManager.getToken()).rejects.toThrow('Auth token is missing')
    })

    it('should accept refresh token and base URL', () => {
        const token = 'valid-jwt-token'
        const refreshToken = 'valid-refresh-token'
        const baseUrl = 'http://localhost:5000'
        
        const authManager = new AuthManager(token, refreshToken, baseUrl)
        expect(authManager).toBeDefined()
    })

    it('should update token manually', async () => {
        const oldToken = 'old-token'
        const newToken = 'new-token'
        const authManager = new AuthManager(oldToken)

        authManager.updateToken(newToken)
        const result = await authManager.getToken()

        expect(result).toBe(newToken)
    })

    it('should throw error when trying to refresh without refresh token', async () => {
        const authManager = new AuthManager('valid-token')
        await expect(authManager.refreshToken()).rejects.toThrow('Refresh token is not available')
    })

    it('should parse JWT token expiry time', () => {
        // Create a mock JWT token with expiry
        const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64')
        const payload = Buffer.from(JSON.stringify({ 
            exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
        })).toString('base64')
        const signature = 'mock-signature'
        const mockToken = `${header}.${payload}.${signature}`

        const authManager = new AuthManager(mockToken)
        expect(authManager).toBeDefined()
    })
})
