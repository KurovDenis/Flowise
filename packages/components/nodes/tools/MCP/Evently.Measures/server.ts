#!/usr/bin/env node
import { MeasuresMCPServer } from './server/MeasuresMCPServer'
import { AuthManager, EventlyApiClient, loadConfig, MCPConfig } from '../shared'

// Load configuration from environment variables
let config: MCPConfig
try {
    config = loadConfig()
} catch (error) {
    console.error('❌ Missing required environment variables')
    console.error('   Required: KEYCLOAK_TOKEN_URL, KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET')
    console.error('   Optional: EVENTLY_API_URL (defaults to http://localhost:5000)')
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
}

// Initialize authentication and API client
const authManager = new AuthManager({
    tokenUrl: config.keycloakTokenUrl,
    clientId: config.keycloakClientId,
    clientSecret: config.keycloakClientSecret
})

const apiClient = new EventlyApiClient(config.eventlyApiUrl, authManager)

// Start MCP server
const server = new MeasuresMCPServer(apiClient)
server.run().catch((error) => {
    console.error('Failed to start Measures MCP Server:', error)
    process.exit(1)
})

console.log('✅ Evently Measures MCP Server started')

