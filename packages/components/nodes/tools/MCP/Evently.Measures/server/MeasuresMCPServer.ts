import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { getMeasureUnitGroups } from '../tools/getMeasureUnitGroups'
import { createMeasureUnitGroup } from '../tools/createMeasureUnitGroup'
import { updateMeasureUnitGroup } from '../tools/updateMeasureUnitGroup'
import { deleteMeasureUnitGroup } from '../tools/deleteMeasureUnitGroup'
import { getMeasureUnits } from '../tools/getMeasureUnits'
import { getMeasureUnit } from '../tools/getMeasureUnit'
import { createMeasureUnit } from '../tools/createMeasureUnit'
import { updateMeasureUnit } from '../tools/updateMeasureUnit'
import { deleteMeasureUnit } from '../tools/deleteMeasureUnit'

/**
 * Measures MCP Server
 * Provides 9 measure-related tools for managing measure unit groups and measure units
 */
export class MeasuresMCPServer extends MCPServerBase {
    private toolHandlers: Map<string, (args: any) => Promise<any>> = new Map()

    constructor(apiClient: EventlyApiClient) {
        super('Evently.Measures', '1.0.0', apiClient)
        this.registerTools()
    }

    /**
     * Register all 9 measure tools
     */
    private registerTools(): void {
        // Measure Unit Groups (4 tools)
        this.toolHandlers.set('get_measure_unit_groups', getMeasureUnitGroups)
        this.toolHandlers.set('create_measure_unit_group', createMeasureUnitGroup)
        this.toolHandlers.set('update_measure_unit_group', updateMeasureUnitGroup)
        this.toolHandlers.set('delete_measure_unit_group', deleteMeasureUnitGroup)

        // Measure Units (5 tools)
        this.toolHandlers.set('get_measure_units', getMeasureUnits)
        this.toolHandlers.set('get_measure_unit', getMeasureUnit)
        this.toolHandlers.set('create_measure_unit', createMeasureUnit)
        this.toolHandlers.set('update_measure_unit', updateMeasureUnit)
        this.toolHandlers.set('delete_measure_unit', deleteMeasureUnit)
    }

    /**
     * Get list of tools provided by this server
     */
    protected getTools(): Tool[] {
        return [
            {
                name: 'get_measure_unit_groups',
                description: 'Get all measure unit groups from Evently API',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'create_measure_unit_group',
                description: 'Create a new measure unit group',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the measure unit group (max 100 characters)' },
                        isSystem: { type: 'boolean', description: 'Whether the group is a system group' }
                    },
                    required: ['name']
                }
            },
            {
                name: 'update_measure_unit_group',
                description: 'Update an existing measure unit group',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the measure unit group' },
                        name: { type: 'string', description: 'Name of the measure unit group (max 100 characters)' }
                    },
                    required: ['id', 'name']
                }
            },
            {
                name: 'delete_measure_unit_group',
                description: 'Delete a measure unit group',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the measure unit group' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'get_measure_units',
                description: 'Get all measure units from Evently API, optionally filtered by group',
                inputSchema: {
                    type: 'object',
                    properties: {
                        groupId: { type: 'string', description: 'Filter by measure unit group ID (UUID)' }
                    }
                }
            },
            {
                name: 'get_measure_unit',
                description: 'Get a specific measure unit by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the measure unit' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'create_measure_unit',
                description: 'Create a new measure unit',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: { type: 'string', description: 'Name of the measure unit (max 100 characters)' },
                        shortName: { type: 'string', description: 'Short name of the measure unit (max 10 characters)' },
                        measureUnitGroupId: { type: 'string', description: 'UUID of the measure unit group' },
                        bmnCode: { type: 'number', description: 'BMN code (integer, optional)' },
                        isBase: { type: 'boolean', description: 'Whether this is a base unit' },
                        isSystem: { type: 'boolean', description: 'Whether this is a system unit' },
                        conversionFactor: { type: 'number', description: 'Conversion factor to base unit' }
                    },
                    required: ['name', 'shortName', 'measureUnitGroupId']
                }
            },
            {
                name: 'update_measure_unit',
                description: 'Update an existing measure unit',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the measure unit' },
                        name: { type: 'string', description: 'Name of the measure unit (max 100 characters)' },
                        shortName: { type: 'string', description: 'Short name of the measure unit (max 10 characters)' },
                        bmnCode: { type: 'number', description: 'BMN code (integer, optional)' },
                        isBase: { type: 'boolean', description: 'Whether this is a base unit' },
                        conversionFactor: { type: 'number', description: 'Conversion factor to base unit' }
                    },
                    required: ['id']
                }
            },
            {
                name: 'delete_measure_unit',
                description: 'Delete a measure unit',
                inputSchema: {
                    type: 'object',
                    properties: {
                        id: { type: 'string', description: 'UUID of the measure unit' }
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

