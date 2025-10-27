#!/usr/bin/env node
import { EventlyMCPServer } from './tools/EventlyMCPServer'
import { AuthManager } from './core/AuthManager'
import { EventlyApiClient } from './core/EventlyApiClient'

// Get configuration from environment variables
const EVENTLY_API_URL = process.env.EVENTLY_API_URL || 'http://localhost:5000'
const EVENTLY_JWT_TOKEN = process.env.EVENTLY_JWT_TOKEN

if (!EVENTLY_JWT_TOKEN) {
    console.error('EVENTLY_JWT_TOKEN environment variable is required')
    process.exit(1)
}

// Create AuthManager and ApiClient
const authManager = new AuthManager(EVENTLY_JWT_TOKEN)
const apiClient = new EventlyApiClient(EVENTLY_API_URL, authManager)

// Start MCP server
const server = new EventlyMCPServer(apiClient)
server.run().catch((error) => {
    console.error('Failed to start Evently MCP Server:', error)
    process.exit(1)
})
