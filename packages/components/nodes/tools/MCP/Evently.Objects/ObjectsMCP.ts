import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../../src/utils'
import { MCPToolkit } from '../core'
import crypto from 'crypto'
import path from 'path'

class Evently_Objects_MCP implements INode {
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
        this.label = 'Evently Objects MCP'
        this.name = 'eventlyObjectsMCP'
        this.version = 1.0
        this.type = 'Evently Objects MCP Tool'
        this.icon = 'evently-objects.svg'
        this.category = 'Tools (MCP)'
        this.description = 'MCP Server for Evently Objects - provides 10 object-related tools (object types, system objects)'
        this.documentation = 'https://github.com/evently/evently-mcp'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['eventlyKeycloakApi']
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
                console.error('Error listing Objects MCP actions:', error)
                return [
                    {
                        label: 'No Available Actions',
                        name: 'error',
                        description: 'No available actions, please check your Evently API configuration'
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
        if (!nodeData.credential) {
            throw new Error('Evently API credential is required. Please select a Keycloak credential.')
        }

        let credentialData = {}
        try {
            credentialData = await getCredentialData(nodeData.credential ?? '', options)

            if (Object.keys(credentialData).length === 0) {
                throw new Error('Credential data is empty. The credential may not be properly encrypted.')
            }
        } catch (error) {
            throw new Error(
                `Failed to decrypt Evently API credential: ${error instanceof Error ? error.message : String(error)}`
            )
        }

        const keycloakClientId = getCredentialParam('keycloakClientId', credentialData, nodeData)
        const keycloakClientSecret = getCredentialParam('keycloakClientSecret', credentialData, nodeData)
        const keycloakTokenUrl = getCredentialParam('keycloakTokenUrl', credentialData, nodeData)
        const apiUrl = getCredentialParam('apiUrl', credentialData, nodeData)
        const baseUrl = ((nodeData.inputs?.baseUrl as string) || apiUrl || 'http://localhost:5000').trim()

        if (!keycloakClientId || !keycloakClientSecret) {
            throw new Error('Keycloak credentials are required. Please configure the Evently API (Keycloak) credential.')
        }

        console.log('Evently Objects MCP: Base URL:', baseUrl)
        console.log('Evently Objects MCP: Client ID:', keycloakClientId)

        // Create cache key
        const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId || 'default'
        const credentialsHash = crypto
            .createHash('sha256')
            .update(`${keycloakClientId}:${keycloakTokenUrl}:${baseUrl}`)
            .digest('hex')
            .substring(0, 16)
        const cacheKey = `evently-objects-mcp-${workspaceId}-${credentialsHash}`

        // Try to get cached tools
        if (options.cachePool) {
            const cachedResult = await options.cachePool.getMCPCache(cacheKey)
            if (cachedResult) {
                console.log('Evently Objects MCP: Using cached tools')
                return cachedResult.tools
            }
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

            console.log(`Evently Objects MCP: Initialized with ${tools.length} tools`)

            // Cache the result
            if (options.cachePool) {
                await options.cachePool.addMCPCache(cacheKey, { toolkit, tools })
            }

            return tools as Tool[]
        } catch (error) {
            throw new Error(`Invalid Evently Objects MCP Server Config: ${error}`)
        }
    }
}

module.exports = { nodeClass: Evently_Objects_MCP }

