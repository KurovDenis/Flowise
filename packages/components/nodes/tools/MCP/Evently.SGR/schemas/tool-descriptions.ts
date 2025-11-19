/**
 * Tool descriptions for SGR Decision Engine
 * 
 * @deprecated This file is kept for backward compatibility.
 * Tool definitions are now in definitions.ts files in each module.
 * This file generates ALL_TOOL_NAMES from the centralized definitions.
 */

import { ATTRIBUTE_TOOLS } from '../../Evently.Attributes/definitions'
import { ENUMERATION_TOOLS as ENUMERATION_TOOLS_DEF } from '../../Evently.Enumerations/definitions'
import { OBJECT_TOOLS } from '../../Evently.Objects/definitions'
import { MEASURE_TOOLS } from '../../Evently.Measures/definitions'

/**
 * Legacy interface for backward compatibility
 * @deprecated Use Tool from @modelcontextprotocol/sdk/types.js instead
 */
export interface ToolDescription {
    name: string
    description: string
    module: string
    parameters: {
        [key: string]: {
            type: string
            description: string
            required?: boolean
        }
    }
}

/**
 * All Evently tools - generated from centralized definitions
 * This ensures single source of truth
 */
export const ALL_EVENTLY_TOOLS: ToolDescription[] = [
    ...ATTRIBUTE_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        module: 'Attributes',
        parameters: Object.entries(tool.inputSchema.properties || {}).reduce((acc, [key, prop]: [string, any]) => {
            const requiredArray = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
            acc[key] = {
                type: prop.type || 'any',
                description: prop.description || '',
                required: requiredArray.includes(key)
            }
            return acc
        }, {} as ToolDescription['parameters'])
    })),
    ...ENUMERATION_TOOLS_DEF.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        module: 'Enumerations',
        parameters: Object.entries(tool.inputSchema.properties || {}).reduce((acc, [key, prop]: [string, any]) => {
            const requiredArray = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
            acc[key] = {
                type: prop.type || 'any',
                description: prop.description || '',
                required: requiredArray.includes(key)
            }
            return acc
        }, {} as ToolDescription['parameters'])
    })),
    ...OBJECT_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        module: 'Objects',
        parameters: Object.entries(tool.inputSchema.properties || {}).reduce((acc, [key, prop]: [string, any]) => {
            const requiredArray = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
            acc[key] = {
                type: prop.type || 'any',
                description: prop.description || '',
                required: requiredArray.includes(key)
            }
            return acc
        }, {} as ToolDescription['parameters'])
    })),
    ...MEASURE_TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        module: 'Measures',
        parameters: Object.entries(tool.inputSchema.properties || {}).reduce((acc, [key, prop]: [string, any]) => {
            const requiredArray = Array.isArray(tool.inputSchema.required) ? tool.inputSchema.required : []
            acc[key] = {
                type: prop.type || 'any',
                description: prop.description || '',
                required: requiredArray.includes(key)
            }
            return acc
        }, {} as ToolDescription['parameters'])
    }))
]

/**
 * Array of all tool names for enum generation in Zod schemas
 * Generated from centralized definitions to ensure consistency
 */
export const ALL_TOOL_NAMES = ALL_EVENTLY_TOOLS.map((t) => t.name) as [string, ...string[]]

/**
 * Tools grouped by module for system prompt (legacy)
 * @deprecated Use definitions.ts files directly
 */
export const TOOLS_BY_MODULE = {
    attributes: ALL_EVENTLY_TOOLS.filter(t => t.module === 'Attributes'),
    enumerations: ALL_EVENTLY_TOOLS.filter(t => t.module === 'Enumerations'),
    objects: ALL_EVENTLY_TOOLS.filter(t => t.module === 'Objects'),
    measures: ALL_EVENTLY_TOOLS.filter(t => t.module === 'Measures')
}

/**
 * Legacy export for backward compatibility
 * @deprecated Use ENUMERATION_TOOLS from Evently.Enumerations/definitions.ts
 */
export const ENUMERATION_TOOLS: ToolDescription[] = ALL_EVENTLY_TOOLS.filter(t => t.module === 'Enumerations')

