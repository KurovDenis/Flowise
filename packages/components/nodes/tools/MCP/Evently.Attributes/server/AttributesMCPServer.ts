import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { ATTRIBUTE_TOOLS } from '../definitions'
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
        return ATTRIBUTE_TOOLS
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
