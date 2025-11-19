import { Tool } from '@modelcontextprotocol/sdk/types.js'

/**
 * Attribute Tools Definitions
 * Single source of truth for all attribute-related tool schemas
 * Used by both AttributesMCPServer and EventlySGRServer
 */
export const ATTRIBUTE_TOOLS: Tool[] = [
    // Attribute Types (5 tools)
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
    // Attributes (7 tools)
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
    // Attribute Groups (5 tools)
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

