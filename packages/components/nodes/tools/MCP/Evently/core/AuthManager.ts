/**
 * AuthManager handles JWT token management for Evently API
 */
export class AuthManager {
    private token: string
    private tokenExpiryTime?: number
    private refreshTokenValue?: string
    private baseUrl?: string

    constructor(token: string, refreshToken?: string, baseUrl?: string) {
        this.token = token
        this.refreshTokenValue = refreshToken
        this.baseUrl = baseUrl
        this.parseTokenExpiry()
    }

    /**
     * Parse JWT token to extract expiry time
     */
    private parseTokenExpiry(): void {
        try {
            if (!this.token) return

            const parts = this.token.split('.')
            if (parts.length !== 3) return

            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
            if (payload.exp) {
                this.tokenExpiryTime = payload.exp * 1000 // Convert to milliseconds
            }
        } catch (error) {
            // Invalid token format, will rely on API error responses
            this.tokenExpiryTime = undefined
        }
    }

    /**
     * Check if token is expired or about to expire (within 5 minutes)
     */
    private isTokenExpired(): boolean {
        if (!this.tokenExpiryTime) return false

        const now = Date.now()
        const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
        return now >= this.tokenExpiryTime - bufferTime
    }

    /**
     * Get the current JWT token
     * @returns Promise<string> The JWT token
     * @throws Error if token is missing
     */
    async getToken(): Promise<string> {
        if (!this.token || this.token.trim() === '') {
            throw new Error('Auth token is missing')
        }

        // Check if token needs refresh
        if (this.isTokenExpired() && this.refreshTokenValue) {
            try {
                await this.refreshToken()
            } catch (error) {
                console.error('Token refresh failed, using existing token:', error)
            }
        }

        return this.token
    }

    /**
     * Refresh the JWT token using refresh token
     * @returns Promise<string> The new JWT token
     * @throws Error if refresh fails or refresh token is missing
     */
    async refreshToken(): Promise<string> {
        if (!this.refreshTokenValue) {
            throw new Error('Refresh token is not available')
        }

        if (!this.baseUrl) {
            throw new Error('Base URL is required for token refresh')
        }

        // TODO: Implement actual refresh endpoint call when Evently API supports it
        // For now, this is a placeholder that returns the current token
        console.warn('Token refresh endpoint not yet implemented in Evently API')

        /*
        // Future implementation example:
        try {
            const response = await axios.post(`${this.baseUrl}/api/auth/refresh`, {
                refreshToken: this.refreshTokenValue
            })
            
            this.token = response.data.accessToken
            if (response.data.refreshToken) {
                this.refreshTokenValue = response.data.refreshToken
            }
            this.parseTokenExpiry()
            
            return this.token
        } catch (error) {
            throw new Error(`Token refresh failed: ${error.message}`)
        }
        */

        return this.getToken()
    }

    /**
     * Update the token manually (e.g., from external rotation)
     */
    updateToken(newToken: string, newRefreshToken?: string): void {
        this.token = newToken
        if (newRefreshToken) {
            this.refreshTokenValue = newRefreshToken
        }
        this.parseTokenExpiry()
    }
}
