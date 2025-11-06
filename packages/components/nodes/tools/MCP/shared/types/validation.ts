import { z } from 'zod'

// Validation utility function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data) // Throws ZodError if invalid
}

