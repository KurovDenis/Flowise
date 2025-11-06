import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { getAttributes } from '../tools/getAttributes'
import { getAttribute } from '../tools/getAttribute'
import { getAttributeByCode } from '../tools/getAttributeByCode'
import { createAttribute } from '../tools/createAttribute'
import { updateAttribute } from '../tools/updateAttribute'
import { deleteAttribute } from '../tools/deleteAttribute'
import { getAttributeGroups } from '../tools/getAttributeGroups'
import { getAttributeGroup } from '../tools/getAttributeGroup'
import { createAttributeGroup } from '../tools/createAttributeGroup'
import { updateAttributeGroup } from '../tools/updateAttributeGroup'
import { deleteAttributeGroup } from '../tools/deleteAttributeGroup'
import { getAttributeTypes } from '../tools/getAttributeTypes'
import { getAttributeType } from '../tools/getAttributeType'
import { createAttributeType } from '../tools/createAttributeType'
import { updateAttributeType } from '../tools/updateAttributeType'
import { deleteAttributeType } from '../tools/deleteAttributeType'

/**
 * Attributes MCP Server
 * Provides 17 attribute-related tools for managing attributes, attribute types, and attribute groups
 */
export class AttributesMCPServer extends MCPServerBase {
    private toolHandlers: Map<string, (args: any) => Promise<any>> = new Map()

    constructor(apiClient: EventlyApiClient) {
        super('Evently.Attributes', '1.0.0', apiClient)
        this.registerTools()
    }

    /**
     * Register all 17 attribute tools
     */
    private registerTools(): void {
        // Attribute Types (5 tools)
        this.toolHandlers.set('get_attribute_types', getAttributeTypes)
        this.toolHandlers.set('get_attribute_type', getAttributeType)
        this.toolHandlers.set('create_attribute_type', createAttributeType)
        this.toolHandlers.set('update_attribute_type', updateAttributeType)
        this.toolHandlers.set('delete_attribute_type', deleteAttributeType)

        // Attributes (7 tools)
        this.toolHandlers.set('get_attributes', getAttributes)
        this.toolHandlers.set('get_attribute', getAttribute)
        this.toolHandlers.set('get_attribute_by_code', getAttributeByCode)
        this.toolHandlers.set('create_attribute', createAttribute)
        this.toolHandlers.set('update_attribute', updateAttribute)
        this.toolHandlers.set('delete_attribute', deleteAttribute)

        // Attribute Groups (5 tools)
        this.toolHandlers.set('get_attribute_groups', getAttributeGroups)
        this.toolHandlers.set('get_attribute_group', getAttributeGroup)
        this.toolHandlers.set('create_attribute_group', createAttributeGroup)
        this.toolHandlers.set('update_attribute_group', updateAttributeGroup)
        this.toolHandlers.set('delete_attribute_group', deleteAttributeGroup)
    }

    /**
     * Get list of tools provided by this server
     */
    protected getTools(): Tool[] {
        return [
            // Attribute Types
            {
                name: 'get_attribute_types',
                description: 'Get all attribute types from Evently API',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_attribute_type',
                description: 'Get a specific attribute type by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            description: 'UUID of the attribute type'
                        }
                    },
                    required: ['id']
                }
            },
            {
                name: 'create_attribute_type',
                description: 'Create a new attribute type',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the attribute type' },
                        description: { type: 'string', description: 'Description of the attribute type' },
                        dataType: { type: 'string', description: 'Data type (e.g., String, Integer, Boolean)' }
                    },
                    required: ['name', 'dataType']
                }
            },
            {
                name: 'update_attribute_type',
                description: 'Update an existing attribute type',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute type' },
                        name: { type: 'string', description: 'Name of the attribute type' },
                        description: { type: 'string', description: 'Description of the attribute type' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'delete_attribute_type',
                description: 'Delete an attribute type',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute type' }
                    },
                    required: ['id']
                }
            },
            // Attributes
            {
                name: 'get_attributes',
                description: 'Get all attributes from Evently API with filtering and pagination',
                inputSchema: {
                    type: 'object',
                    properties: {
                        searchTerm: { type: 'string', description: 'Search by name, short name or code' },
                        dataType: { type: 'string', description: 'Filter by data type' },
                        attributeGroupId: { type: 'string', description: 'Filter by attribute group ID (UUID)' },
                        objectTypeCode: { type: 'number', description: 'Filter by object type code' },
                        isRequired: { type: 'boolean', description: 'Filter by required attribute flag' },
                        page: { type: 'number', description: 'Page number (starting from 1)', default: 1 },
                        pageSize: { type: 'number', description: 'Page size (maximum 100)', default: 10 }
                    }
                }
            },
            {
                name: 'get_attribute',
                description: 'Get a specific attribute by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'get_attribute_by_code',
                description: 'Get a specific attribute by its unique code',
                inputSchema: {
                    type: 'object',
                    properties: {
                        code: {
                            type: 'string',
                            description:
                                'Attribute code (must start with uppercase and contain only uppercase letters, numbers, and underscores; max 20)'
                        }
                    },
                    required: ['code']
                }
            },
            {
                name: 'create_attribute',
                description: 'Create a new attribute with all required properties',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the attribute (max 100 characters)' },
                        shortName: { type: 'string', description: 'Short name for API (max 20 characters)' },
                        code: { type: 'string', description: 'Unique code for the attribute (max 20 characters)' },
                        dataType: {
                            type: 'string',
                            description: 'Data type (String, Number, Decimal, Boolean, Date, DateTime, Time, Enumeration, Reference)'
                        },
                        isComputed: { type: 'boolean', description: 'Whether the attribute is computed', default: false },
                        isSystemAttribute: { type: 'boolean', description: 'Whether the attribute is system attribute', default: false },
                        isMeasureAble: { type: 'boolean', description: 'Whether the attribute is measurable', default: false },
                        isReadOnly: { type: 'boolean', description: 'Whether the attribute is read-only', default: false },
                        formulaExpression: { type: 'string', description: 'Formula expression for computed attributes' },
                        enumerationId: { type: 'string', description: 'UUID of enumeration for Enumeration type attributes' },
                        referenceAttributeId: { type: 'string', description: 'UUID of reference attribute' },
                        targetAttributeId: { type: 'string', description: 'UUID of target attribute' }
                    },
                    required: ['name', 'shortName', 'code', 'dataType']
                }
            },
            {
                name: 'update_attribute',
                description: 'Update basic properties of an existing attribute',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute' },
                        name: { type: 'string', description: 'New name of the attribute (max 100 characters)' },
                        shortName: { type: 'string', description: 'New short name of the attribute (max 20 characters)' },
                        formulaExpression: { type: 'string', description: 'New formula expression for computed attributes' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'delete_attribute',
                description: 'Delete an attribute',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute' }
                    },
                    required: ['id']
                }
            },
            // Attribute Groups
            {
                name: 'get_attribute_groups',
                description: 'Get all attribute groups from Evently API with filtering and pagination',
                inputSchema: {
                    type: 'object',
                    properties: {
                        objectTypeCode: { type: 'number', description: 'Filter by object type code' },
                        searchTerm: { type: 'string', description: 'Search by name or description' },
                        page: { type: 'number', description: 'Page number (starting from 1)', default: 1 },
                        pageSize: { type: 'number', description: 'Page size (maximum 100)', default: 10 }
                    }
                }
            },
            {
                name: 'get_attribute_group',
                description: 'Get a specific attribute group by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute group' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'create_attribute_group',
                description: 'Create a new attribute group for a specific object type',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the attribute group (max 100 characters)' },
                        description: { type: 'string', description: 'Description of the attribute group (max 500 characters)' },
                        objectTypeCode: { type: 'number', description: 'Object type code for which the group is created' }
                    },
                    required: ['name', 'description', 'objectTypeCode']
                }
            },
            {
                name: 'update_attribute_group',
                description: 'Update an existing attribute group',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute group' },
                        name: { type: 'string', description: 'Name of the attribute group' },
                        description: { type: 'string', description: 'Description of the attribute group' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'delete_attribute_group',
                description: 'Delete an attribute group',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the attribute group' }
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
