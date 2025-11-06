import axios, { AxiosError } from 'axios'
import { getObservabilityProvider } from './ObservabilityProvider'

/**
 * Configuration for Keycloak token provider
 */
export interface TokenProviderConfig {
    tokenUrl: string
    clientId: string
    clientSecret: string
}

/**
 * Token data structure
 */
export interface TokenData {
    accessToken: string
    refreshToken?: string
    expiresAt: number // Unix timestamp in milliseconds
}

/**
 * KeycloakTokenProvider manages JWT token lifecycle via OAuth2 Client Credentials Flow
 * 
 * Features:
 * - Automatic token acquisition via Client Credentials
 * - Proactive refresh (5 minutes before expiration)
 * - Fallback to new token request if refresh fails
 * - Retry logic with exponential backoff
 */
export class KeycloakTokenProvider {
    private config: TokenProviderConfig
    private currentToken?: TokenData
    private refreshLock: Promise<string> | null = null
    private observability = getObservabilityProvider()

    constructor(config: TokenProviderConfig) {
        if (!config.tokenUrl || !config.clientId || !config.clientSecret) {
            throw new Error('KeycloakTokenProvider: tokenUrl, clientId, and clientSecret are required')
        }

        this.config = config
    }

    /**
     * Get valid token, automatically refresh if needed
     */
    async getToken(): Promise<string> {
        // No token yet → request new
        if (!this.currentToken) {
            await this.requestNewToken()
            return this.currentToken!.accessToken
        }

        // Token expires soon (< 5 min) → refresh
        const now = Date.now()
        const bufferTime = 5 * 60 * 1000 // 5 minutes buffer
        if (now >= this.currentToken.expiresAt - bufferTime) {
            await this.refreshToken()
        }

        return this.currentToken.accessToken
    }

    /**
     * Request new token via Client Credentials Flow
     */
    private async requestNewToken(retryCount: number = 0): Promise<void> {
        const maxRetries = 3
        const baseDelay = 1000 // 1 second

        try {
            this.observability.debug('Requesting new token from Keycloak', {
                tokenUrl: this.config.tokenUrl,
                clientId: this.config.clientId
            })

            const response = await axios.post(
                this.config.tokenUrl,
                new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: this.config.clientId,
                    client_secret: this.config.clientSecret
                }),
                {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    timeout: 10000
                }
            )

            const { access_token, refresh_token, expires_in } = response.data

            if (!access_token) {
                throw new Error('No access_token in Keycloak response')
            }

            this.currentToken = {
                accessToken: access_token,
                refreshToken: refresh_token,
                expiresAt: Date.now() + (expires_in || 300) * 1000 // Default 5 minutes if not provided
            }

            this.observability.info('Token obtained successfully', {
                expiresIn: expires_in,
                expiresAt: new Date(this.currentToken.expiresAt).toISOString()
            })

            this.observability.recordMetric('keycloak_token_request_success_total', 1)
            this.observability.recordMetric('keycloak_token_expiry_seconds', expires_in || 300)

        } catch (error: any) {
            const axiosError = error as AxiosError

            this.observability.error('Failed to obtain token from Keycloak', {
                error: axiosError.message,
                status: axiosError.response?.status,
                retryCount
            })

            this.observability.recordMetric('keycloak_token_request_error_total', 1, {
                error_type: axiosError.response?.status?.toString() || 'unknown'
            })

            // Retry with exponential backoff
            if (retryCount < maxRetries && this.shouldRetry(axiosError)) {
                const delay = baseDelay * Math.pow(2, retryCount)
                this.observability.warn(`Retrying token request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`)

                await new Promise((resolve) => setTimeout(resolve, delay))
                return this.requestNewToken(retryCount + 1)
            }

            throw new Error(`Token request failed: ${axiosError.message || 'Unknown error'}`)
        }
    }

    /**
     * Refresh token using refresh_token (if available) or request new token
     */
    private async refreshToken(): Promise<void> {
        // Prevent concurrent refresh requests
        if (this.refreshLock) {
            return this.refreshLock.then(() => Promise.resolve())
        }

        this.refreshLock = (async () => {
            try {
                if (!this.currentToken?.refreshToken) {
                    // No refresh token → request new token
                    this.observability.warn('No refresh token available, requesting new token')
                    await this.requestNewToken()
                    return this.currentToken!.accessToken
                }

                try {
                    this.observability.debug('Refreshing token using refresh_token')

                    const response = await axios.post(
                        this.config.tokenUrl,
                        new URLSearchParams({
                            grant_type: 'refresh_token',
                            refresh_token: this.currentToken.refreshToken,
                            client_id: this.config.clientId,
                            client_secret: this.config.clientSecret
                        }),
                        {
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            timeout: 10000
                        }
                    )

                    const { access_token, refresh_token, expires_in } = response.data

                    this.currentToken = {
                        accessToken: access_token || this.currentToken.accessToken,
                        refreshToken: refresh_token || this.currentToken.refreshToken,
                        expiresAt: Date.now() + (expires_in || 300) * 1000
                    }

                    this.observability.info('Token refreshed successfully', {
                        expiresIn: expires_in,
                        expiresAt: new Date(this.currentToken.expiresAt).toISOString()
                    })

                    this.observability.recordMetric('keycloak_token_refresh_success_total', 1)

                    return this.currentToken.accessToken

                } catch (refreshError: any) {
                    const axiosError = refreshError as AxiosError

                    this.observability.warn('Token refresh failed, requesting new token', {
                        error: axiosError.message,
                        status: axiosError.response?.status
                    })

                    this.observability.recordMetric('keycloak_token_refresh_error_total', 1, {
                        error_type: axiosError.response?.status?.toString() || 'unknown'
                    })

                    // Fallback: request new token
                    await this.requestNewToken()
                    return this.currentToken!.accessToken
                }
            } finally {
                this.refreshLock = null
            }
        })()

        await this.refreshLock
    }

    /**
     * Determine if request should be retried
     */
    private shouldRetry(error: AxiosError): boolean {
        // Don't retry if there's no response (network error)
        if (!error.response) {
            return true
        }

        // Retry on 5xx errors
        if (error.response.status >= 500 && error.response.status < 600) {
            return true
        }

        // Retry on 429 (rate limit)
        if (error.response.status === 429) {
            return true
        }

        // Don't retry on 4xx (client errors) except 429
        return false
    }

    /**
     * Clear current token (useful for testing or manual refresh)
     */
    clearToken(): void {
        this.currentToken = undefined
        this.observability.debug('Token cleared')
    }

    /**
     * Get current token info (for debugging)
     */
    getTokenInfo(): { expiresAt?: number; isExpiringSoon: boolean } | null {
        if (!this.currentToken) {
            return null
        }

        const now = Date.now()
        const bufferTime = 5 * 60 * 1000
        return {
            expiresAt: this.currentToken.expiresAt,
            isExpiringSoon: now >= this.currentToken.expiresAt - bufferTime
        }
    }
}

