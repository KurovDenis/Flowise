import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { OBJECT_TOOLS } from '../definitions'
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
        return OBJECT_TOOLS
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

