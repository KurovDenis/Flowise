import { Tool } from '@modelcontextprotocol/sdk/types.js'

/**
 * Enumeration Tools Definitions
 * Single source of truth for all enumeration-related tool schemas
 * Used by both EnumerationsMCPServer and EventlySGRServer
 */
export const ENUMERATION_TOOLS: Tool[] = [
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

