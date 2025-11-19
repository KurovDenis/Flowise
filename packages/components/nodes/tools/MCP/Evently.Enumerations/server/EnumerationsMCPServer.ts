import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { ENUMERATION_TOOLS } from '../definitions'
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
        return ENUMERATION_TOOLS
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

