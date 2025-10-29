#!/usr/bin/env node
import { EventlyMCPServer } from './tools/EventlyMCPServer'
import { AuthManager } from './core/AuthManager'
import { EventlyApiClient } from './core/EventlyApiClient'

// Get configuration from environment variables
const EVENTLY_API_URL = process.env.EVENTLY_API_URL || 'http://localhost:5000'
const KEYCLOAK_TOKEN_URL = process.env.KEYCLOAK_TOKEN_URL
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET
const EVENTLY_JWT_TOKEN = process.env.EVENTLY_JWT_TOKEN // Legacy support

// Determine if using new Keycloak credentials or legacy JWT token
const useKeycloak = !!(KEYCLOAK_TOKEN_URL && KEYCLOAK_CLIENT_ID && KEYCLOAK_CLIENT_SECRET)
const useLegacyToken = !!EVENTLY_JWT_TOKEN && !useKeycloak

let authManager: AuthManager

if (useKeycloak) {
    // New Keycloak credential format (recommended)
    console.log('✅ Using Keycloak credentials with auto-refresh')
    authManager = new AuthManager({
        tokenUrl: KEYCLOAK_TOKEN_URL,
        clientId: KEYCLOAK_CLIENT_ID,
        clientSecret: KEYCLOAK_CLIENT_SECRET
    })
} else if (useLegacyToken) {
    // Legacy JWT token format (deprecated, for backward compatibility only)
    console.warn('⚠️  Using legacy JWT token (deprecated). Please migrate to Keycloak credentials.')
    console.warn('⚠️  Legacy tokens will expire and require manual refresh.')
    
    // For legacy support, we need to create a minimal config
    // This is a workaround - ideally legacy credentials should be migrated
    // We'll use a dummy Keycloak config but the token won't auto-refresh
    throw new Error(
        'Legacy JWT token format is no longer supported. ' +
        'Please use "Evently API (Keycloak)" credential type with client_id and client_secret for automatic token refresh.'
    )
} else {
    // No credentials provided
    console.error('❌ Missing required environment variables')
    console.error('   For Keycloak credentials (recommended):')
    console.error('     KEYCLOAK_TOKEN_URL:', !!KEYCLOAK_TOKEN_URL)
    console.error('     KEYCLOAK_CLIENT_ID:', !!KEYCLOAK_CLIENT_ID)
    console.error('     KEYCLOAK_CLIENT_SECRET:', !!KEYCLOAK_CLIENT_SECRET)
    console.error('')
    console.error('   Please configure Keycloak credentials in Flowise credential or docker-compose.yml')
    process.exit(1)
}

const apiClient = new EventlyApiClient(EVENTLY_API_URL, authManager)

// Start MCP server
const server = new EventlyMCPServer(apiClient)
server.run().catch((error) => {
    console.error('Failed to start Evently MCP Server:', error)
    process.exit(1)
})

console.log('✅ Evently MCP Server started with auto-refreshing token')
