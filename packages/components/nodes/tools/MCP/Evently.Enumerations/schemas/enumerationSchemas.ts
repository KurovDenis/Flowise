import { z } from 'zod'

// Enumerations validation schemas
export const GetEnumerationsInputSchema = z.object({
    searchTerm: z.string().optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10)
})

export const GetEnumerationInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for enumeration ID')
})

export const CreateEnumerationInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    values: z.array(
        z.object({
            name: z.string().min(1, 'Value name is required').max(200, 'Value name must be less than 200 characters'),
            description: z.string().max(500, 'Value description must be less than 500 characters').optional(),
            order: z.number().int().nonnegative('Order must be non-negative')
        })
    ).optional()
})

export const UpdateEnumerationInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for enumeration ID'),
    name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional()
})

export const AddEnumerationValueInputSchema = z.object({
    enumerationId: z.string().uuid('Invalid UUID format for enumeration ID'),
    name: z.string().min(1, 'Value name is required').max(200, 'Value name must be less than 200 characters'),
    description: z.string().max(500, 'Value description must be less than 500 characters').optional(),
    order: z.number().int().nonnegative('Order must be non-negative').optional()
})

export const UpdateEnumerationValueInputSchema = z.object({
    enumerationId: z.string().uuid('Invalid UUID format for enumeration ID'),
    valueId: z.string().uuid('Invalid UUID format for enumeration value ID'),
    name: z.string().min(1, 'Value name is required').max(200, 'Value name must be less than 200 characters'),
    description: z.string().max(500, 'Value description must be less than 500 characters').optional(),
    order: z.number().int().nonnegative('Order must be non-negative')
})

export const DeleteEnumerationValueInputSchema = z.object({
    enumerationId: z.string().uuid('Invalid UUID format for enumeration ID'),
    valueId: z.string().uuid('Invalid UUID format for enumeration value ID')
})

export const DeleteEnumerationInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for enumeration ID')
})

