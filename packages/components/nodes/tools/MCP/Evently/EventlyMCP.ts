import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../../src/utils'
import { MCPToolkit } from '../core'
import { createCacheProvider } from './core/CacheProvider'
import crypto from 'crypto'
import path from 'path'

class Evently_MCP implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    documentation: string
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Evently MCP'
        this.name = 'eventlyMCP'
        this.version = 1.0
        this.type = 'Evently MCP Tool'
        this.icon = 'evently.svg'
        this.category = 'Tools (MCP)'
        this.description =
            'MCP Server for Evently AttributeValue API - provides access to AttributeTypes, Attributes, AttributeGroups, ObjectTypes, SystemObjects, MeasureUnits, and MeasureUnitGroups'
        this.documentation = 'https://github.com/evently/evently-mcp'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['eventlyKeycloakApi', 'eventlyApi']
        }
        this.inputs = [
            {
                label: 'Available Actions',
                name: 'mcpActions',
                type: 'asyncMultiOptions',
                loadMethod: 'listActions',
                refresh: true
            },
            {
                label: 'API Base URL',
                name: 'baseUrl',
                type: 'string',
                default: 'http://localhost:5000',
                description: 'Base URL of the Evently API (without /api suffix)'
            }
        ]
        this.baseClasses = ['Tool']
    }

    //@ts-ignore
    loadMethods = {
        listActions: async (nodeData: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> => {
            try {
                const toolset = await this.getTools(nodeData, options)
                toolset.sort((a: any, b: any) => a.name.localeCompare(b.name))

                return toolset.map(({ name, ...rest }) => ({
                    label: name.toUpperCase(),
                    name: name,
                    description: rest.description || name
                }))
            } catch (error) {
                console.error('Error listing actions:', error)
                return [
                    {
                        label: 'No Available Actions',
                        name: 'error',
                        description: 'No available actions, please check your Evently API configuration and JWT token'
                    }
                ]
            }
        }
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const tools = await this.getTools(nodeData, options)

        const _mcpActions = nodeData.inputs?.mcpActions
        let mcpActions = []
        if (_mcpActions) {
            try {
                mcpActions = typeof _mcpActions === 'string' ? JSON.parse(_mcpActions) : _mcpActions
            } catch (error) {
                console.error('Error parsing mcp actions:', error)
            }
        }

        return tools.filter((tool: any) => mcpActions.includes(tool.name))
    }

    async getTools(nodeData: INodeData, options: ICommonObject): Promise<Tool[]> {
        // Skip if no credential is selected
        if (!nodeData.credential) {
            console.error('Evently MCP: No credential ID provided in nodeData.credential')
            throw new Error(
                'Evently API credential is required. Please select a credential or ensure Keycloak credentials are configured in docker-compose.yml.'
            )
        }

        let credentialData = {}
        try {
            credentialData = await getCredentialData(nodeData.credential ?? '', options)

            // Debug logging for credential data
            console.log('Evently MCP: Credential data keys:', Object.keys(credentialData))

            if (Object.keys(credentialData).length === 0) {
                console.error('Evently MCP: Credential data is empty after decryption')
                throw new Error(
                    'Credential data is empty. The credential may not be properly encrypted or the encryption key is incorrect.'
                )
            }
        } catch (error) {
            console.error('Evently MCP: Error decrypting credential:', error)
            throw new Error(
                `Failed to decrypt Evently API credential: ${
                    error instanceof Error ? error.message : String(error)
                }. Please ensure the credential was created with the correct type.`
            )
        }

        // Check if using new Keycloak credential format or legacy token format
        const keycloakClientId = getCredentialParam('keycloakClientId', credentialData, nodeData)
        const keycloakClientSecret = getCredentialParam('keycloakClientSecret', credentialData, nodeData)
        const keycloakTokenUrl = getCredentialParam('keycloakTokenUrl', credentialData, nodeData)
        const jwtToken = getCredentialParam('token', credentialData, nodeData)
        const apiUrl = getCredentialParam('apiUrl', credentialData, nodeData)
        const baseUrl = ((nodeData.inputs?.baseUrl as string) || apiUrl || 'http://localhost:5000').trim()

        // Determine credential type: new (Keycloak) or legacy (JWT token)
        const isKeycloakCredential = !!(keycloakClientId && keycloakClientSecret)

        if (isKeycloakCredential) {
            // New Keycloak credential format
            console.log('Evently MCP: Using Keycloak credential (auto-refresh enabled)')
            console.log('Evently MCP: Base URL:', baseUrl)
            console.log('Evently MCP: Keycloak Token URL:', keycloakTokenUrl)
            console.log('Evently MCP: Client ID:', keycloakClientId)

            if (!keycloakClientSecret) {
                throw new Error(
                    'Missing Keycloak client secret in credential. Please ensure the credential contains "keycloakClientSecret" field.'
                )
            }

            // Create cache key for this configuration (hash credentials for security)
            const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId || 'default'
            const credentialsHash = crypto
                .createHash('sha256')
                .update(`${keycloakClientId}:${keycloakTokenUrl}:${baseUrl}`)
                .digest('hex')
                .substring(0, 16)
            const cacheKey = `evently-mcp-keycloak-${workspaceId}-${credentialsHash}`

            // Try to get cached tools
            const cacheProvider = createCacheProvider()
            const cachedResult = await cacheProvider.get(cacheKey)
            if (cachedResult) {
                return cachedResult.tools
            }

            try {
                // Create stdio server configuration for MCP
                const serverParams = {
                    command: 'node',
                    args: [path.join(__dirname, 'server.js')],
                    env: {
                        EVENTLY_API_URL: baseUrl,
                        KEYCLOAK_TOKEN_URL:
                            keycloakTokenUrl ||
                            process.env.KEYCLOAK_TOKEN_URL ||
                            'http://evently.identity:8080/realms/evently/protocol/openid-connect/token',
                        KEYCLOAK_CLIENT_ID: keycloakClientId,
                        KEYCLOAK_CLIENT_SECRET: keycloakClientSecret
                    }
                }

                const toolkit = new MCPToolkit(serverParams, 'stdio')
                await toolkit.initialize()

                const tools = toolkit.tools ?? []

                // Cache the result for 5 minutes
                await cacheProvider.set(cacheKey, { tools }, 300)

                return tools as Tool[]
            } catch (error) {
                throw new Error(`Invalid Evently MCP Server Config: ${error}`)
            }
        } else {
            // Legacy JWT token format (for backward compatibility)
            console.log('Evently MCP: Using legacy JWT token credential (deprecated)')
            console.log('Evently MCP: Base URL:', baseUrl)
            console.log('Evently MCP: JWT Token found:', !!jwtToken, 'Token length:', jwtToken ? jwtToken.length : 0)

            if (!jwtToken) {
                console.error('Evently MCP: Missing JWT token in credential data')
                console.error('Evently MCP: Available credential data keys:', Object.keys(credentialData))
                throw new Error(
                    'Missing Evently JWT Token in credential. Please use the new "Evently API (Keycloak)" credential type for automatic token refresh.'
                )
            }

            // Trim and validate JWT token to prevent encoding issues
            const trimmedToken = jwtToken.trim()
            if (!trimmedToken || trimmedToken.length === 0) {
                throw new Error('Evently JWT Token is empty or contains only whitespace')
            }

            // Basic JWT format validation (should have 3 parts separated by dots)
            const tokenParts = trimmedToken.split('.')
            if (tokenParts.length !== 3) {
                throw new Error('Invalid JWT Token format. Expected format: header.payload.signature')
            }

            // Create cache key for this configuration (hash token for security)
            const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId || 'default'
            const tokenHash = crypto.createHash('sha256').update(trimmedToken).digest('hex').substring(0, 16)
            const cacheKey = `evently-mcp-legacy-${workspaceId}-${tokenHash}`

            // Try to get cached tools
            const cacheProvider = createCacheProvider()
            const cachedResult = await cacheProvider.get(cacheKey)
            if (cachedResult) {
                return cachedResult.tools
            }

            try {
                // Create stdio server configuration for MCP (legacy mode)
                // Note: This will fail if server.ts expects Keycloak credentials
                // Legacy support requires fallback in server.ts or separate legacy server
                const serverParams = {
                    command: 'node',
                    args: [path.join(__dirname, 'server.js')],
                    env: {
                        EVENTLY_API_URL: baseUrl,
                        // Legacy mode: try to pass token as before (may not work with new server.ts)
                        EVENTLY_JWT_TOKEN: trimmedToken
                    }
                }

                const toolkit = new MCPToolkit(serverParams, 'stdio')
                await toolkit.initialize()

                const tools = toolkit.tools ?? []

                // Cache the result for 5 minutes
                await cacheProvider.set(cacheKey, { tools }, 300)

                return tools as Tool[]
            } catch (error) {
                throw new Error(
                    `Invalid Evently MCP Server Config: ${error}. Please migrate to the new "Evently API (Keycloak)" credential type.`
                )
            }
        }
    }
}

module.exports = { nodeClass: Evently_MCP }
