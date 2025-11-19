import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { ALL_TOOL_NAMES } from './tool-descriptions'

/**
 * Main schema for structured output from AI model
 * This defines the format of the decision returned by the SGR engine
 */
export const NextStepSchema = z.object({
    reasoning_steps: z.array(z.string()).min(2).max(5),
    clarification_needed: z.boolean(),
    decision_type: z.enum(['clarification', 'execute_tool', 'task_complete']),
    // Fields for execute_tool
    tool_name: z.enum(ALL_TOOL_NAMES).optional(),
    tool_parameters: z.record(z.any()).optional(),
    // Fields for clarification
    questions: z.array(z.string()).optional(),
    unclear_aspects: z.array(z.string()).optional(),
    possible_interpretations: z.array(z.string()).optional(),
    // General fields
    confidence: z.enum(['high', 'medium', 'low']).optional()
})

/**
 * TypeScript type inferred from NextStepSchema
 */
export type NextStep = z.infer<typeof NextStepSchema>

/**
 * Input schema for sgr_get_available_tools MCP tool
 */
export const SgrGetAvailableToolsInputSchema = z.object({})

/**
 * Convert Zod schema to JSON Schema for OpenAI structured output
 */
export const NextStepJsonSchema = zodToJsonSchema(NextStepSchema, 'NextStep')
export const SgrGetAvailableToolsInputJsonSchema = zodToJsonSchema(SgrGetAvailableToolsInputSchema, 'SgrGetAvailableToolsInput')
