/**
 * Configuration loader for MCP servers
 * Loads configuration from environment variables
 */

export interface MCPConfig {
    eventlyApiUrl: string
    keycloakTokenUrl: string
    keycloakClientId: string
    keycloakClientSecret: string
}

/**
 * Load configuration from environment variables
 * @throws Error if required environment variables are missing
 */
export function loadConfig(): MCPConfig {
    const eventlyApiUrl = process.env.EVENTLY_API_URL || 'http://localhost:5000'
    const keycloakTokenUrl = process.env.KEYCLOAK_TOKEN_URL
    const keycloakClientId = process.env.KEYCLOAK_CLIENT_ID
    const keycloakClientSecret = process.env.KEYCLOAK_CLIENT_SECRET

    if (!keycloakTokenUrl) {
        throw new Error('KEYCLOAK_TOKEN_URL environment variable is required')
    }

    if (!keycloakClientId) {
        throw new Error('KEYCLOAK_CLIENT_ID environment variable is required')
    }

    if (!keycloakClientSecret) {
        throw new Error('KEYCLOAK_CLIENT_SECRET environment variable is required')
    }

    return {
        eventlyApiUrl,
        keycloakTokenUrl,
        keycloakClientId,
        keycloakClientSecret
    }
}

