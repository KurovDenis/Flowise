import { Tool } from '@langchain/core/tools'
import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../../src/Interface'
import { getCredentialData, getCredentialParam } from '../../../../src/utils'
import { MCPToolkit } from '../core'
import { EventlyApiClient } from './core/EventlyApiClient'
import { AuthManager } from './core/AuthManager'
import { createCacheProvider } from './core/CacheProvider'
import crypto from 'crypto'

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
        this.description = 'MCP Server for Evently AttributeValue API - provides access to AttributeTypes, Attributes, AttributeGroups, ObjectTypes, SystemObjects, MeasureUnits, and MeasureUnitGroups'
        this.documentation = 'https://github.com/evently/evently-mcp'
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['eventlyApi']
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
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const jwtToken = getCredentialParam('token', credentialData, nodeData)
        const baseUrl = nodeData.inputs?.baseUrl as string || 'http://localhost:5000'

        if (!jwtToken) {
            throw new Error('Missing Evently JWT Token')
        }

        // Create cache key for this configuration (hash token for security)
        const workspaceId = options?.searchOptions?.workspaceId?._value || options?.workspaceId || 'default'
        const tokenHash = crypto.createHash('sha256').update(jwtToken).digest('hex').substring(0, 16)
        const cacheKey = `evently-mcp-${workspaceId}-${tokenHash}`

        // Try to get cached tools
        const cacheProvider = createCacheProvider()
        const cachedResult = await cacheProvider.get(cacheKey)
        if (cachedResult) {
            return cachedResult.tools
        }

        try {
            // Create SSE server configuration for MCP
            const serverParams = {
                url: `${baseUrl}/api/mcp/sse`,
                headers: {
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            }

            const toolkit = new MCPToolkit(serverParams, 'sse')
            await toolkit.initialize()

            const tools = toolkit.tools ?? []

            // Cache the result for 5 minutes
            await cacheProvider.set(cacheKey, { tools }, 300)

            return tools as Tool[]
        } catch (error) {
            throw new Error(`Invalid Evently MCP Server Config: ${error}`)
        }
    }
}

module.exports = { nodeClass: Evently_MCP }
