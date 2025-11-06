import { ZodError } from 'zod'
import { getObservabilityProvider } from '../core/ObservabilityProvider'

/**
 * Standardized error handling for MCP servers
 * Formats errors according to RFC 7807 Problem Details
 */
export function handleError(error: any, serverName: string): string {
    const observability = getObservabilityProvider()

    // Zod validation errors
    if (error instanceof ZodError) {
        const issues = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        observability.warn('Validation error', { server: serverName, issues })
        return `Validation error: ${issues}`
    }

    // Standard Error objects
    if (error instanceof Error) {
        observability.error('Error occurred', { server: serverName, error: error.message, stack: error.stack })
        return error.message
    }

    // String errors
    if (typeof error === 'string') {
        observability.error('Error occurred', { server: serverName, error })
        return error
    }

    // Unknown error type
    const errorMessage = JSON.stringify(error)
    observability.error('Unknown error type', { server: serverName, error: errorMessage })
    return `Unknown error: ${errorMessage}`
}

/**
 * Create Problem Details response (RFC 7807)
 */
export interface ProblemDetails {
    type: string
    title: string
    status: number
    detail: string
    instance?: string
    errors?: Record<string, string[]>
}

export function createProblemDetails(
    status: number,
    title: string,
    detail: string,
    instance?: string,
    errors?: Record<string, string[]>
): ProblemDetails {
    return {
        type: `https://evently.api/errors/${status}`,
        title,
        status,
        detail,
        instance,
        errors
    }
}

