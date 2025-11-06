import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { getObjectTypes } from '../tools/getObjectTypes'
import { getObjectType } from '../tools/getObjectType'
import { updateObjectType } from '../tools/updateObjectType'
import { getSystemObjects } from '../tools/getSystemObjects'
import { getSystemObject } from '../tools/getSystemObject'
import { createSystemObject } from '../tools/createSystemObject'
import { updateSystemObject } from '../tools/updateSystemObject'
import { deleteSystemObject } from '../tools/deleteSystemObject'

/**
 * Objects MCP Server
 * Provides 8 object-related tools for managing object types and system objects
 */
export class ObjectsMCPServer extends MCPServerBase {
    private toolHandlers: Map<string, (args: any) => Promise<any>> = new Map()

    constructor(apiClient: EventlyApiClient) {
        super('Evently.Objects', '1.0.0', apiClient)
        this.registerTools()
    }

    /**
     * Register all 8 object tools
     */
    private registerTools(): void {
        // Object Types (3 tools)
        this.toolHandlers.set('get_object_types', getObjectTypes)
        this.toolHandlers.set('get_object_type', getObjectType)
        this.toolHandlers.set('update_object_type', updateObjectType)

        // System Objects (5 tools)
        this.toolHandlers.set('get_system_objects', getSystemObjects)
        this.toolHandlers.set('get_system_object', getSystemObject)
        this.toolHandlers.set('create_system_object', createSystemObject)
        this.toolHandlers.set('update_system_object', updateSystemObject)
        this.toolHandlers.set('delete_system_object', deleteSystemObject)
    }

    /**
     * Get list of tools provided by this server
     */
    protected getTools(): Tool[] {
        return [
            {
                name: 'get_object_types',
                description: 'Get all object types from Evently API with filtering and pagination',
                inputSchema: {
                    type: 'object',
                    properties: {
                        typeKind: { type: 'string', description: 'Filter by type kind' },
                        isSystem: { type: 'boolean', description: 'Filter by system flag' },
                        searchTerm: { type: 'string', description: 'Search by name or description' },
                        page: { type: 'number', description: 'Page number (starting from 1)', default: 1 },
                        pageSize: { type: 'number', description: 'Page size (maximum 100)', default: 10 }
                    }
                }
            },
            {
                name: 'get_object_type',
                description: 'Get a specific object type by code',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectTypeCode: { type: 'number', description: 'Object type code (positive integer)' }
                    },
                    required: ['objectTypeCode']
                }
            },
            {
                name: 'update_object_type',
                description: 'Update an existing object type',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectTypeCode: { type: 'number', description: 'Object type code (positive integer)' },
                        name: { type: 'string', description: 'Name of the object type (max 100 characters)' },
                        description: { type: 'string', description: 'Description of the object type (max 500 characters)' }
                    },
                    required: ['objectTypeCode']
                }
            },
            {
                name: 'get_system_objects',
                description: 'Get all system objects from Evently API with filtering and pagination',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectTypeCode: { type: 'number', description: 'Filter by object type code' },
                        containerId: { type: 'string', description: 'Filter by container ID (UUID)' },
                        searchTerm: { type: 'string', description: 'Search term (max 200 characters)' },
                        page: { type: 'number', description: 'Page number (starting from 1)', default: 1 },
                        pageSize: { type: 'number', description: 'Page size (maximum 100)', default: 10 }
                    }
                }
            },
            {
                name: 'get_system_object',
                description: 'Get a specific system object by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the system object' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'create_system_object',
                description: 'Create a new system object with attribute values',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectTypeCode: { type: 'number', description: 'Object type code (positive integer)' },
                        schemeCode: { type: 'string', description: 'Scheme code (UUID, optional)' },
                        attributeValues: {
                            type: 'array',
                            description: 'Array of attribute values (at least one required)',
                            items: {
                                type: 'object',
                                properties: {
                                    attributeId: { type: 'string', description: 'UUID of the attribute' },
                                    value: { description: 'Attribute value (can be string, number, boolean, etc.)' },
                                    isComputed: { type: 'boolean', description: 'Whether the value is computed', default: false }
                                },
                                required: ['attributeId', 'value']
                            },
                            minItems: 1
                        }
                    },
                    required: ['objectTypeCode', 'attributeValues']
                }
            },
            {
                name: 'update_system_object',
                description: 'Update attribute values of an existing system object',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the system object' },
                        attributeValueUpdates: {
                            type: 'array',
                            description: 'Array of attribute value updates (1-50 items)',
                            items: {
                                type: 'object',
                                properties: {
                                    attributeId: { type: 'string', description: 'UUID of the attribute' },
                                    value: { description: 'New attribute value (can be string, number, boolean, etc.)' }
                                },
                                required: ['attributeId', 'value']
                            },
                            minItems: 1,
                            maxItems: 50
                        }
                    },
                    required: ['id', 'attributeValueUpdates']
                }
            },
            {
                name: 'delete_system_object',
                description: 'Delete a system object',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the system object' }
                    },
                    required: ['id']
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

