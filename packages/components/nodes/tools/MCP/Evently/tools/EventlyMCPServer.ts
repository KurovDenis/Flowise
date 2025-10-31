import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { EventlyApiClient } from '../core/EventlyApiClient'
import { AuthManager } from '../core/AuthManager'
import { validateInput } from '../types/validation'
import {
    GetAttributeTypesInputSchema,
    GetAttributeTypeInputSchema,
    CreateAttributeTypeInputSchema,
    UpdateAttributeTypeInputSchema,
    DeleteAttributeTypeInputSchema,
    GetAttributesInputSchema,
    GetAttributeByCodeInputSchema,
    GetAttributeInputSchema,
    CreateAttributeInputSchema,
    UpdateAttributeInputSchema,
    DeleteAttributeInputSchema,
    GetAttributeShortNamesInputSchema,
    GetAttributeGroupsInputSchema,
    GetAttributeGroupInputSchema,
    CreateAttributeGroupInputSchema,
    UpdateAttributeGroupInputSchema,
    DeleteAttributeGroupInputSchema,
    GetObjectTypesInputSchema,
    GetObjectTypeInputSchema,
    UpdateObjectTypeInputSchema,
    GetRequiredAttributesInputSchema,
    RemoveAttributeFromObjectTypeInputSchema,
    GetSystemObjectsInputSchema,
    GetSystemObjectInputSchema,
    CreateSystemObjectInputSchema,
    UpdateSystemObjectInputSchema,
    DeleteSystemObjectInputSchema
} from '../types/validation'

class EventlyMCPServer {
    private server: Server
    private apiClient: EventlyApiClient

    constructor(apiClient: EventlyApiClient) {
        this.apiClient = apiClient

        this.server = new Server(
            {
                name: 'evently-mcp-server',
                version: '1.0.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        )

        this.setupHandlers()
    }

    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    // AttributeTypes tools
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
                                name: {
                                    type: 'string',
                                    description: 'Name of the attribute type'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Description of the attribute type'
                                },
                                dataType: {
                                    type: 'string',
                                    description: 'Data type (e.g., String, Integer, Boolean)'
                                }
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute type'
                                },
                                name: {
                                    type: 'string',
                                    description: 'Name of the attribute type'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Description of the attribute type'
                                }
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute type'
                                }
                            },
                            required: ['id']
                        }
                    },
                    // Attributes tools
                    {
                        name: 'get_attributes',
                        description: 'Get all attributes from Evently API with filtering and pagination',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                searchTerm: {
                                    type: 'string',
                                    description: 'Search by name, short name or code'
                                },
                                dataType: {
                                    type: 'string',
                                    description: 'Filter by data type'
                                },
                                attributeGroupId: {
                                    type: 'string',
                                    description: 'Filter by attribute group ID (UUID)'
                                },
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Filter by object type code'
                                },
                                isRequired: {
                                    type: 'boolean',
                                    description: 'Filter by required attribute flag'
                                },
                                page: {
                                    type: 'number',
                                    description: 'Page number (starting from 1)',
                                    default: 1
                                },
                                pageSize: {
                                    type: 'number',
                                    description: 'Page size (maximum 100)',
                                    default: 10
                                }
                            }
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
                        name: 'get_attribute',
                        description: 'Get a specific attribute by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute'
                                }
                            },
                            required: ['id']
                        }
                    },
                    {
                        name: 'create_attribute',
                        description: 'Create a new attribute with all required properties',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                name: {
                                    type: 'string',
                                    description: 'Name of the attribute (max 100 characters)'
                                },
                                shortName: {
                                    type: 'string',
                                    description: 'Short name for API (max 20 characters)'
                                },
                                code: {
                                    type: 'string',
                                    description: 'Unique code for the attribute (max 20 characters)'
                                },
                                dataType: {
                                    type: 'string',
                                    description:
                                        'Data type (String, Number, Decimal, Boolean, Date, DateTime, Time, Enumeration, Reference)'
                                },
                                isComputed: {
                                    type: 'boolean',
                                    description: 'Whether the attribute is computed',
                                    default: false
                                },
                                isSystemAttribute: {
                                    type: 'boolean',
                                    description: 'Whether the attribute is system attribute',
                                    default: false
                                },
                                isMeasureAble: {
                                    type: 'boolean',
                                    description: 'Whether the attribute is measurable',
                                    default: false
                                },
                                isReadOnly: {
                                    type: 'boolean',
                                    description: 'Whether the attribute is read-only',
                                    default: false
                                },
                                formulaExpression: {
                                    type: 'string',
                                    description: 'Formula expression for computed attributes'
                                },
                                enumerationId: {
                                    type: 'string',
                                    description: 'UUID of enumeration for Enumeration type attributes'
                                },
                                referenceAttributeId: {
                                    type: 'string',
                                    description: 'UUID of reference attribute'
                                },
                                targetAttributeId: {
                                    type: 'string',
                                    description: 'UUID of target attribute'
                                }
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute'
                                },
                                name: {
                                    type: 'string',
                                    description: 'New name of the attribute (max 100 characters)'
                                },
                                shortName: {
                                    type: 'string',
                                    description: 'New short name of the attribute (max 20 characters)'
                                },
                                formulaExpression: {
                                    type: 'string',
                                    description: 'New formula expression for computed attributes'
                                }
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute'
                                }
                            },
                            required: ['id']
                        }
                    },
                    {
                        name: 'get_attribute_short_names',
                        description: 'Get short names for multiple attributes',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                ids: {
                                    type: 'array',
                                    items: {
                                        type: 'string'
                                    },
                                    description: 'Array of attribute UUIDs'
                                }
                            },
                            required: ['ids']
                        }
                    },
                    // AttributeGroups tools
                    {
                        name: 'get_attribute_groups',
                        description: 'Get all attribute groups from Evently API with filtering and pagination',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Filter by object type code'
                                },
                                searchTerm: {
                                    type: 'string',
                                    description: 'Search by name or description'
                                },
                                page: {
                                    type: 'number',
                                    description: 'Page number (starting from 1)',
                                    default: 1
                                },
                                pageSize: {
                                    type: 'number',
                                    description: 'Page size (maximum 100)',
                                    default: 10
                                }
                            }
                        }
                    },
                    {
                        name: 'get_attribute_group',
                        description: 'Get a specific attribute group by ID',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute group'
                                }
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
                                name: {
                                    type: 'string',
                                    description: 'Name of the attribute group (max 100 characters)'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Description of the attribute group (max 500 characters)'
                                },
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Object type code for which the group is created'
                                }
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute group'
                                },
                                name: {
                                    type: 'string',
                                    description: 'Name of the attribute group'
                                },
                                description: {
                                    type: 'string',
                                    description: 'Description of the attribute group'
                                }
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the attribute group'
                                }
                            },
                            required: ['id']
                        }
                    },
                    // ObjectTypes tools
                    {
                        name: 'get_object_types',
                        description: 'Get all object types from Evently API with filtering and pagination',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                typeKind: {
                                    type: 'string',
                                    description: 'Filter by object type kind (Container, Regular)'
                                },
                                isSystem: {
                                    type: 'boolean',
                                    description: 'Filter by system type flag'
                                },
                                searchTerm: {
                                    type: 'string',
                                    description: 'Search by name or short name'
                                },
                                page: {
                                    type: 'number',
                                    description: 'Page number (starting from 1)',
                                    default: 1
                                },
                                pageSize: {
                                    type: 'number',
                                    description: 'Page size (maximum 100)',
                                    default: 10
                                }
                            }
                        }
                    },
                    {
                        name: 'get_object_type',
                        description: 'Get a specific object type by code',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Object type code'
                                }
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
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Object type code'
                                },
                                name: {
                                    type: 'string',
                                    description: 'New name of the object type (max 100 characters)'
                                },
                                description: {
                                    type: 'string',
                                    description: 'New description of the object type (max 500 characters)'
                                }
                            },
                            required: ['objectTypeCode']
                        }
                    },
                    {
                        name: 'get_required_attributes',
                        description: 'Get required attributes for an object type',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Object type code'
                                }
                            },
                            required: ['objectTypeCode']
                        }
                    },
                    {
                        name: 'remove_attribute_from_object_type',
                        description: 'Remove an attribute from an object type',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Object type code'
                                },
                                attributeId: {
                                    type: 'string',
                                    description: 'UUID of the attribute to remove'
                                }
                            },
                            required: ['objectTypeCode', 'attributeId']
                        }
                    },
                    // System Objects tools
                    {
                        name: 'get_system_objects',
                        description: 'Get all system objects from Evently API with filtering and pagination',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Filter by object type code'
                                },
                                containerId: {
                                    type: 'string',
                                    description: 'Filter by container ID (UUID)'
                                },
                                searchTerm: {
                                    type: 'string',
                                    description: 'Search by values or names'
                                },
                                page: {
                                    type: 'number',
                                    description: 'Page number (starting from 1)',
                                    default: 1
                                },
                                pageSize: {
                                    type: 'number',
                                    description: 'Page size (maximum 100)',
                                    default: 10
                                }
                            }
                        }
                    },
                    {
                        name: 'get_system_object',
                        description: 'Get a specific system object by ID with all attribute values',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    description: 'UUID of the system object'
                                }
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
                                objectTypeCode: {
                                    type: 'number',
                                    description: 'Object type code for the new system object'
                                },
                                schemeCode: {
                                    type: 'string',
                                    description: 'Optional scheme code (UUID)'
                                },
                                attributeValues: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            attributeId: {
                                                type: 'string',
                                                description: 'UUID of the attribute'
                                            },
                                            value: {
                                                description: 'Value for the attribute (can be string, number, boolean, etc.)'
                                            },
                                            isComputed: {
                                                type: 'boolean',
                                                description: 'Whether this is a computed attribute',
                                                default: false
                                            }
                                        },
                                        required: ['attributeId', 'value']
                                    },
                                    description: 'Array of attribute values for the system object'
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the system object'
                                },
                                attributeValueUpdates: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            attributeId: {
                                                type: 'string',
                                                description: 'UUID of the attribute to update'
                                            },
                                            value: {
                                                description: 'New value for the attribute'
                                            }
                                        },
                                        required: ['attributeId', 'value']
                                    },
                                    description: 'Array of attribute value updates (max 50)'
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
                                id: {
                                    type: 'string',
                                    description: 'UUID of the system object'
                                }
                            },
                            required: ['id']
                        }
                    }
                ]
            }
        })

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params

            try {
                let result: any

                switch (name) {
                    // AttributeTypes
                    case 'get_attribute_types':
                        validateInput(GetAttributeTypesInputSchema, args)
                        result = await this.apiClient.get('/attribute-types')
                        break

                    case 'get_attribute_type': {
                        const getAttrTypeArgs = validateInput(GetAttributeTypeInputSchema, args)
                        result = await this.apiClient.get(`/attribute-types/${getAttrTypeArgs.id}`)
                        break
                    }

                    case 'create_attribute_type': {
                        const createAttrTypeArgs = validateInput(CreateAttributeTypeInputSchema, args)
                        result = await this.apiClient.post('/attribute-types', createAttrTypeArgs)
                        break
                    }

                    case 'update_attribute_type': {
                        const updateAttrTypeArgs = validateInput(UpdateAttributeTypeInputSchema, args)
                        result = await this.apiClient.put(`/attribute-types/${updateAttrTypeArgs.id}`, updateAttrTypeArgs)
                        break
                    }

                    case 'delete_attribute_type': {
                        const deleteAttrTypeArgs = validateInput(DeleteAttributeTypeInputSchema, args)
                        await this.apiClient.delete(`/attribute-types/${deleteAttrTypeArgs.id}`)
                        result = { success: true, message: 'Attribute type deleted' }
                        break
                    }

                    // Attributes
                    case 'get_attributes': {
                        const getAttrsArgs = validateInput(GetAttributesInputSchema, args)
                        const queryParams = new URLSearchParams()

                        if (getAttrsArgs.searchTerm) queryParams.append('searchTerm', getAttrsArgs.searchTerm)
                        if (getAttrsArgs.dataType) queryParams.append('dataType', getAttrsArgs.dataType)
                        if (getAttrsArgs.attributeGroupId) queryParams.append('attributeGroupId', getAttrsArgs.attributeGroupId)
                        if (getAttrsArgs.objectTypeCode) queryParams.append('objectTypeCode', getAttrsArgs.objectTypeCode.toString())
                        if (getAttrsArgs.isRequired !== undefined) queryParams.append('isRequired', getAttrsArgs.isRequired.toString())
                        queryParams.append('page', (getAttrsArgs.page ?? 1).toString())
                        queryParams.append('pageSize', (getAttrsArgs.pageSize ?? 10).toString())

                        const queryString = queryParams.toString()
                        result = await this.apiClient.get(`/attributes${queryString ? `?${queryString}` : ''}`)
                        break
                    }

                    case 'get_attribute': {
                        const getAttrArgs = validateInput(GetAttributeInputSchema, args)
                        result = await this.apiClient.get(`/attributes/${getAttrArgs.id}`)
                        break
                    }

                    case 'get_attribute_by_code': {
                        const getAttrByCodeArgs = validateInput(GetAttributeByCodeInputSchema, args)
                        result = await this.apiClient.get(`/attributes/by-code/${getAttrByCodeArgs.code}`)
                        break
                    }

                    case 'create_attribute': {
                        const createAttrArgs = validateInput(CreateAttributeInputSchema, args)
                        result = await this.apiClient.post('/attributes', createAttrArgs)
                        break
                    }

                    case 'update_attribute': {
                        const id = (args as any).id
                        if (!id) {
                            throw new Error('ID is required for update_attribute')
                        }
                        const updateAttrArgs = validateInput(UpdateAttributeInputSchema, args)
                        result = await this.apiClient.put(`/attributes/${id}`, updateAttrArgs)
                        break
                    }

                    case 'delete_attribute': {
                        const deleteAttrArgs = validateInput(DeleteAttributeInputSchema, args)
                        await this.apiClient.delete(`/attributes/${deleteAttrArgs.id}`)
                        result = { success: true, message: 'Attribute deleted' }
                        break
                    }

                    case 'get_attribute_short_names': {
                        const shortNamesArgs = validateInput(GetAttributeShortNamesInputSchema, args)
                        result = await this.apiClient.post('/attributes/short-names', { ids: shortNamesArgs.ids })
                        break
                    }

                    // AttributeGroups
                    case 'get_attribute_groups': {
                        const getAttrGroupsArgs = validateInput(GetAttributeGroupsInputSchema, args)
                        const queryParams = new URLSearchParams()

                        if (getAttrGroupsArgs.objectTypeCode) {
                            queryParams.append('objectTypeCode', getAttrGroupsArgs.objectTypeCode.toString())
                        }
                        if (getAttrGroupsArgs.searchTerm) queryParams.append('searchTerm', getAttrGroupsArgs.searchTerm)
                        queryParams.append('page', (getAttrGroupsArgs.page ?? 1).toString())
                        queryParams.append('pageSize', (getAttrGroupsArgs.pageSize ?? 10).toString())

                        const queryString = queryParams.toString()
                        result = await this.apiClient.get(`/attribute-groups${queryString ? `?${queryString}` : ''}`)
                        break
                    }

                    case 'get_attribute_group': {
                        const getAttrGroupArgs = validateInput(GetAttributeGroupInputSchema, args)
                        result = await this.apiClient.get(`/attribute-groups/${getAttrGroupArgs.id}`)
                        break
                    }

                    case 'create_attribute_group': {
                        const createAttrGroupArgs = validateInput(CreateAttributeGroupInputSchema, args)
                        result = await this.apiClient.post('/attribute-groups', createAttrGroupArgs)
                        break
                    }

                    case 'update_attribute_group': {
                        const id = (args as any).id
                        if (!id) {
                            throw new Error('ID is required for update_attribute_group')
                        }
                        const updateAttrGroupArgs = validateInput(UpdateAttributeGroupInputSchema, args)
                        result = await this.apiClient.put(`/attribute-groups/${id}`, updateAttrGroupArgs)
                        break
                    }

                    case 'delete_attribute_group': {
                        const deleteAttrGroupArgs = validateInput(DeleteAttributeGroupInputSchema, args)
                        await this.apiClient.delete(`/attribute-groups/${deleteAttrGroupArgs.id}`)
                        result = { success: true, message: 'Attribute group deleted' }
                        break
                    }

                    // ObjectTypes
                    case 'get_object_types': {
                        const getObjectTypesArgs = validateInput(GetObjectTypesInputSchema, args)
                        const queryParams = new URLSearchParams()

                        if (getObjectTypesArgs.typeKind) queryParams.append('typeKind', getObjectTypesArgs.typeKind)
                        if (getObjectTypesArgs.isSystem !== undefined) {
                            queryParams.append('isSystem', getObjectTypesArgs.isSystem.toString())
                        }
                        if (getObjectTypesArgs.searchTerm) queryParams.append('searchTerm', getObjectTypesArgs.searchTerm)
                        queryParams.append('page', (getObjectTypesArgs.page ?? 1).toString())
                        queryParams.append('pageSize', (getObjectTypesArgs.pageSize ?? 10).toString())

                        const queryString = queryParams.toString()
                        result = await this.apiClient.get(`/object-types${queryString ? `?${queryString}` : ''}`)
                        break
                    }

                    case 'get_object_type': {
                        const getObjectTypeArgs = validateInput(GetObjectTypeInputSchema, args)
                        result = await this.apiClient.get(`/object-types/${getObjectTypeArgs.objectTypeCode}`)
                        break
                    }

                    case 'update_object_type': {
                        const updateObjectTypeArgs = validateInput(UpdateObjectTypeInputSchema, args)
                        const { objectTypeCode, ...updateData } = updateObjectTypeArgs
                        result = await this.apiClient.put(`/object-types/${objectTypeCode}`, updateData)
                        break
                    }

                    case 'get_required_attributes': {
                        const getRequiredAttrsArgs = validateInput(GetRequiredAttributesInputSchema, args)
                        result = await this.apiClient.get(`/object-types/${getRequiredAttrsArgs.objectTypeCode}/required-attributes`)
                        break
                    }

                    case 'remove_attribute_from_object_type': {
                        const removeAttrArgs = validateInput(RemoveAttributeFromObjectTypeInputSchema, args)
                        await this.apiClient.delete(
                            `/object-types/${removeAttrArgs.objectTypeCode}/attributes/${removeAttrArgs.attributeId}`
                        )
                        result = { success: true, message: 'Attribute removed from object type' }
                        break
                    }

                    // System Objects
                    case 'get_system_objects': {
                        const getSystemObjectsArgs = validateInput(GetSystemObjectsInputSchema, args)
                        const queryParams = new URLSearchParams()

                        if (getSystemObjectsArgs.objectTypeCode) {
                            queryParams.append('objectTypeCode', getSystemObjectsArgs.objectTypeCode.toString())
                        }
                        if (getSystemObjectsArgs.containerId) {
                            queryParams.append('containerId', getSystemObjectsArgs.containerId)
                        }
                        if (getSystemObjectsArgs.searchTerm) {
                            queryParams.append('searchTerm', getSystemObjectsArgs.searchTerm)
                        }
                        queryParams.append('page', (getSystemObjectsArgs.page ?? 1).toString())
                        queryParams.append('pageSize', (getSystemObjectsArgs.pageSize ?? 10).toString())

                        const queryString = queryParams.toString()
                        result = await this.apiClient.get(`/system-objects${queryString ? `?${queryString}` : ''}`)
                        break
                    }

                    case 'get_system_object': {
                        const getSystemObjectArgs = validateInput(GetSystemObjectInputSchema, args)
                        result = await this.apiClient.get(`/system-objects/${getSystemObjectArgs.id}`)
                        break
                    }

                    case 'create_system_object': {
                        const createSystemObjectArgs = validateInput(CreateSystemObjectInputSchema, args)
                        result = await this.apiClient.post('/system-objects', createSystemObjectArgs)
                        break
                    }

                    case 'update_system_object': {
                        const id = (args as any).id
                        if (!id) {
                            throw new Error('ID is required for update_system_object')
                        }
                        const updateSystemObjectArgs = validateInput(UpdateSystemObjectInputSchema, args)
                        result = await this.apiClient.put(`/system-objects/${id}`, updateSystemObjectArgs)
                        break
                    }

                    case 'delete_system_object': {
                        const deleteSystemObjectArgs = validateInput(DeleteSystemObjectInputSchema, args)
                        await this.apiClient.delete(`/system-objects/${deleteSystemObjectArgs.id}`)
                        result = { success: true, message: 'System object deleted' }
                        break
                    }

                    default:
                        throw new Error(`Unknown tool: ${name}`)
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`
                        }
                    ],
                    isError: true
                }
            }
        })
    }

    async run(): Promise<void> {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('Evently MCP Server running on stdio')
    }
}

// Start the server if this file is run directly
if (require.main === module) {
    // Check for Keycloak credentials (new method)
    const KEYCLOAK_TOKEN_URL = process.env.KEYCLOAK_TOKEN_URL
    const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID
    const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET
    if (!KEYCLOAK_TOKEN_URL || !KEYCLOAK_CLIENT_ID || !KEYCLOAK_CLIENT_SECRET) {
        console.error('KEYCLOAK_TOKEN_URL, KEYCLOAK_CLIENT_ID, and KEYCLOAK_CLIENT_SECRET environment variables are required')
        process.exit(1)
    }

    const authManager = new AuthManager({
        tokenUrl: KEYCLOAK_TOKEN_URL,
        clientId: KEYCLOAK_CLIENT_ID,
        clientSecret: KEYCLOAK_CLIENT_SECRET
    })
    const baseUrl = process.env.EVENTLY_API_URL || 'http://localhost:5000'
    const apiClient = new EventlyApiClient(baseUrl, authManager)

    const server = new EventlyMCPServer(apiClient)
    server.run().catch(console.error)
}

export { EventlyMCPServer }
