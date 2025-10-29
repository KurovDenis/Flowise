import { KeycloakTokenProvider, TokenProviderConfig } from './KeycloakTokenProvider'

/**
 * AuthManager handles JWT token management for Evently API
 * Now uses KeycloakTokenProvider for automatic token refresh
 */
export class AuthManager {
    private tokenProvider: KeycloakTokenProvider

    constructor(config: TokenProviderConfig) {
        this.tokenProvider = new KeycloakTokenProvider(config)
    }

    /**
     * Get the current JWT token (automatically refreshed if needed)
     * @returns Promise<string> The JWT token
     * @throws Error if token cannot be obtained
     */
    async getToken(): Promise<string> {
        return await this.tokenProvider.getToken()
    }
}
