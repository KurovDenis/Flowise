import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { SgrGetAvailableToolsInputSchema } from '../schemas/sgr-schemas'
import { ATTRIBUTE_TOOLS } from '../../Evently.Attributes/definitions'
import { ENUMERATION_TOOLS } from '../../Evently.Enumerations/definitions'
import { OBJECT_TOOLS } from '../../Evently.Objects/definitions'
import { MEASURE_TOOLS } from '../../Evently.Measures/definitions'

/**
 * Evently SGR MCP Server
 * Provides tool to get available Evently API tools with descriptions and parameters
 */
export class EventlySGRServer extends MCPServerBase {
    constructor(apiClient: EventlyApiClient) {
        super('Evently.SGR', '1.0.0', apiClient)
    }

    /**
     * Get list of tools provided by this server
     */
    protected getTools(): Tool[] {
        return [
            {
                name: 'sgr_get_available_tools',
                description: 'Get list of available Evently API tools with their descriptions and parameters. Use this tool to understand what tools are available before making decisions.',
                inputSchema: zodToJsonSchema(SgrGetAvailableToolsInputSchema) as any
            }
        ]
    }

    /**
     * Handle tool call
     */
    protected async handleToolCall(name: string, args: any): Promise<any> {
        switch (name) {
            case 'sgr_get_available_tools':
                return await this.handleGetAvailableTools(args)
            default:
                throw new Error(`Tool '${name}' not found`)
        }
    }

    /**
     * Returns list of available tools with descriptions and parameters
     */
    private async handleGetAvailableTools(args: any): Promise<any> {
        SgrGetAvailableToolsInputSchema.parse(args)

        // Group tools by module
        const toolsByModule = {
            Attributes: ATTRIBUTE_TOOLS,
            Enumerations: ENUMERATION_TOOLS,
            Objects: OBJECT_TOOLS,
            Measures: MEASURE_TOOLS
        }

        // Convert MCP Tool format to SGR format
        const formattedTools = Object.entries(toolsByModule).map(([module, tools]) => ({
            module,
            tools: tools.map(tool => {
                const requiredArray = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
                return {
                    name: tool.name,
                    description: tool.description || '',
                    parameters: Object.entries(tool.inputSchema.properties || {}).map(([paramName, prop]: [string, any]) => ({
                        name: paramName,
                        type: prop.type || 'any',
                        description: prop.description || '',
                        required: requiredArray.includes(paramName)
                    }))
                }
            })
        }))

        const totalCount = ATTRIBUTE_TOOLS.length + ENUMERATION_TOOLS.length + OBJECT_TOOLS.length + MEASURE_TOOLS.length

        return {
            available_tools: formattedTools,
            total_count: totalCount,
            modules: Object.keys(toolsByModule)
        }
    }
}

