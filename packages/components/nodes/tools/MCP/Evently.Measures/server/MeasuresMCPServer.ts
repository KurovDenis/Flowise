import { Tool } from '@modelcontextprotocol/sdk/types.js'
import { MCPServerBase, EventlyApiClient } from '../../shared'
import { MEASURE_TOOLS } from '../definitions'
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
        return MEASURE_TOOLS
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

