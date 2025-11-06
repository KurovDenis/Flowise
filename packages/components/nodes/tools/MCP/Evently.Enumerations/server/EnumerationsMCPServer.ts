import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { getEnumerations } from '../tools/getEnumerations'
import { getEnumeration } from '../tools/getEnumeration'
import { createEnumeration } from '../tools/createEnumeration'
import { updateEnumeration } from '../tools/updateEnumeration'
import { deleteEnumeration } from '../tools/deleteEnumeration'
import { addEnumerationValue } from '../tools/addEnumerationValue'
import { updateEnumerationValue } from '../tools/updateEnumerationValue'
import { deleteEnumerationValue } from '../tools/deleteEnumerationValue'

/**
 * Enumerations MCP Server
 * Provides 8 enumeration-related tools for managing enumerations and enumeration values
 */
export class EnumerationsMCPServer extends MCPServerBase {
    private toolHandlers: Map<string, (args: any) => Promise<any>> = new Map()

    constructor(apiClient: EventlyApiClient) {
        super('Evently.Enumerations', '1.0.0', apiClient)
        this.registerTools()
    }

    /**
     * Register all 8 enumeration tools
     */
    private registerTools(): void {
        // Enumerations (5 tools)
        this.toolHandlers.set('get_enumerations', getEnumerations)
        this.toolHandlers.set('get_enumeration', getEnumeration)
        this.toolHandlers.set('create_enumeration', createEnumeration)
        this.toolHandlers.set('update_enumeration', updateEnumeration)
        this.toolHandlers.set('delete_enumeration', deleteEnumeration)

        // Enumeration Values (3 tools)
        this.toolHandlers.set('add_enumeration_value', addEnumerationValue)
        this.toolHandlers.set('update_enumeration_value', updateEnumerationValue)
        this.toolHandlers.set('delete_enumeration_value', deleteEnumerationValue)
    }

    /**
     * Get list of tools provided by this server
     */
    protected getTools(): Tool[] {
        return [
            {
                name: 'get_enumerations',
                description: 'Get all enumerations from Evently API with filtering and pagination',
                inputSchema: {
                    type: 'object',
                    properties: {
                        searchTerm: { type: 'string', description: 'Search by name or description' },
                        page: { type: 'number', description: 'Page number (starting from 1)', default: 1 },
                        pageSize: { type: 'number', description: 'Page size (maximum 100)', default: 10 }
                    }
                }
            },
            {
                name: 'get_enumeration',
                description: 'Get a specific enumeration by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the enumeration' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'create_enumeration',
                description: 'Create a new enumeration with optional values',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the enumeration (max 200 characters)' },
                        description: { type: 'string', description: 'Description of the enumeration (max 500 characters)' },
                        values: {
                            type: 'array',
                            description: 'Optional array of enumeration values to create with the enumeration',
                            items: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string', description: 'Value name (max 200 characters)' },
                                    description: { type: 'string', description: 'Value description (max 500 characters)' },
                                    order: { type: 'number', description: 'Display order (non-negative integer)' }
                                },
                                required: ['name', 'order']
                            }
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'update_enumeration',
                description: 'Update an existing enumeration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the enumeration' },
                        name: { type: 'string', description: 'Name of the enumeration (max 200 characters)' },
                        description: { type: 'string', description: 'Description of the enumeration (max 500 characters)' }
                    },
                    required: ['id', 'name']
                }
            },
            {
                name: 'delete_enumeration',
                description: 'Delete an enumeration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the enumeration' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'add_enumeration_value',
                description: 'Add a new value to an existing enumeration',
                inputSchema: {
                    type: 'object',
                    properties: {
                        enumerationId: { type: 'string', description: 'UUID of the enumeration' },
                        name: { type: 'string', description: 'Value name (max 200 characters)' },
                        description: { type: 'string', description: 'Value description (max 500 characters)' },
                        order: { type: 'number', description: 'Display order (non-negative integer)' }
                    },
                    required: ['enumerationId', 'name']
                }
            },
            {
                name: 'update_enumeration_value',
                description: 'Update an existing enumeration value',
                inputSchema: {
                    type: 'object',
                    properties: {
                        enumerationId: { type: 'string', description: 'UUID of the enumeration' },
                        valueId: { type: 'string', description: 'UUID of the enumeration value' },
                        name: { type: 'string', description: 'Value name (max 200 characters)' },
                        description: { type: 'string', description: 'Value description (max 500 characters)' },
                        order: { type: 'number', description: 'Display order (non-negative integer)' }
                    },
                    required: ['enumerationId', 'valueId', 'name', 'order']
                }
            },
            {
                name: 'delete_enumeration_value',
                description: 'Delete an enumeration value',
                inputSchema: {
                    type: 'object',
                    properties: {
                        enumerationId: { type: 'string', description: 'UUID of the enumeration' },
                        valueId: { type: 'string', description: 'UUID of the enumeration value' }
                    },
                    required: ['enumerationId', 'valueId']
                }
            }
        ]
    }

    /**
     * Handle tool call
     */
    protected async handleToolCall(name: string, args: any): Promise<any> {
        const handler = this.toolHandlers.get(name)
        if (!handler) {
            throw new Error(`Tool '${name}' not found`)
        }

        return await handler({ ...args, apiClient: this.apiClient })
    }
}

