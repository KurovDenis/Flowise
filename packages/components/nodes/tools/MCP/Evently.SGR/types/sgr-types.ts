/**
 * Context for SGR session management
 */
export interface SGRContext {
    clarification_used: boolean
    iteration_count: number
    session_id?: string
}

/**
 * Decision type enum
 */
export type DecisionType = 'clarification' | 'execute_tool' | 'task_complete'

/**
 * Confidence level enum
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low'
