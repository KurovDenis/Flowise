import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js'
import { EventlyApiClient } from './EventlyApiClient'
import { getObservabilityProvider } from './ObservabilityProvider'
import { handleError } from '../utils/errorHandler'

/**
 * Base class for Evently MCP servers
 * Provides common functionality for all domain-specific MCP servers
 */
export abstract class MCPServerBase {
    protected server: Server
    protected apiClient: EventlyApiClient
    protected observability = getObservabilityProvider()
    protected serverName: string
    protected serverVersion: string

    constructor(serverName: string, serverVersion: string, apiClient: EventlyApiClient) {
        this.serverName = serverName
        this.serverVersion = serverVersion
        this.apiClient = apiClient

        this.server = new Server(
            {
                name: this.serverName,
                version: this.serverVersion
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        )

        this.setupHandlers()
    }

    /**
     * Setup common handlers (list_tools, call_tool)
     *
     * Note: This method is called automatically in the constructor.
     * If subclasses need to extend this behavior, they should override setupHandlers()
     * and call super.setupHandlers() first, then register their domain-specific tools.
     */
    protected setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = this.getTools()
            return { tools }
        })

        // Call tool handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                const { name, arguments: args } = request.params

                this.observability.debug(`Tool called: ${name}`, { args })

                const result = await this.handleToolCall(name, args || {})

                this.observability.debug(`Tool completed: ${name}`, { result })

                return {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }
                    ]
                }
            } catch (error: any) {
                const errorMessage = handleError(error, this.serverName)
                this.observability.error(`Tool error: ${request.params.name}`, { error: errorMessage })

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    error: errorMessage,
                                    server: this.serverName
                                },
                                null,
                                2
                            )
                        }
                    ],
                    isError: true
                }
            }
        })
    }

    /**
     * Get list of tools provided by this server
     * Must be implemented by subclasses
     */
    protected abstract getTools(): Tool[]

    /**
     * Handle tool call
     * Must be implemented by subclasses
     */
    protected abstract handleToolCall(name: string, args: any): Promise<any>

    /**
     * Run the MCP server on stdio transport
     */
    async run(): Promise<void> {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)

        const toolCount = this.getTools().length
        this.observability.info(`${this.serverName} started`, {
            version: this.serverVersion,
            toolCount
        })

        console.error(`${this.serverName} v${this.serverVersion} running on stdio with ${toolCount} tools`)
    }
}
