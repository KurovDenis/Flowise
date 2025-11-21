import { Tool } from '@modelcontextprotocol/sdk/types.js'

/**
 * Measures Tools Definitions
 * Single source of truth for all measure-related tool schemas
 * Used by both MeasuresMCPServer and EventlySGRServer
 */
export const MEASURE_TOOLS: Tool[] = [
    // Measure Unit Groups (4 tools)
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
    // Measure Units (5 tools)
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
                shortName: { type: 'string', description: 'Short name of the measure unit (max 20 characters)' },
                measureUnitGroupId: { type: 'string', description: 'UUID of the measure unit group' },
                bmnCode: { type: 'number', description: 'BMN code (integer, optional)' },
                isBase: { type: 'boolean', description: 'Whether this is a base unit' },
                isSystem: { type: 'boolean', description: 'Whether this is a system unit' },
                isCalendar: { type: 'boolean', description: 'Whether this is a calendar unit (month, quarter, year - cannot have fixed conversion factor)' },
                conversionFactor: { type: 'number', description: 'Conversion factor to base unit' },
                systemName: { type: 'string', description: 'System name of the measure unit (max 100 characters, optional)' },
                internationalCode: { type: 'string', description: 'International code of the measure unit (max 20 characters, optional)' }
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
                shortName: { type: 'string', description: 'Short name of the measure unit (max 20 characters)' },
                bmnCode: { type: 'number', description: 'BMN code (integer, optional)' },
                isBase: { type: 'boolean', description: 'Whether this is a base unit' },
                isCalendar: { type: 'boolean', description: 'Whether this is a calendar unit (month, quarter, year - cannot have fixed conversion factor)' },
                conversionFactor: { type: 'number', description: 'Conversion factor to base unit' },
                systemName: { type: 'string', description: 'System name of the measure unit (max 100 characters, optional)' },
                internationalCode: { type: 'string', description: 'International code of the measure unit (max 20 characters, optional)' }
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
    },
    {
        name: 'convert_measure_unit',
        description: 'Convert a value between different measure units within the same group',
        inputSchema: {
            type: 'object',
            properties: {
                sourceUnitId: { type: 'string', description: 'UUID of the source measure unit' },
                targetUnitId: { type: 'string', description: 'UUID of the target measure unit' },
                value: { type: 'number', description: 'Value to convert (must be positive)' }
            },
            required: ['sourceUnitId', 'targetUnitId', 'value']
        }
    }
]

