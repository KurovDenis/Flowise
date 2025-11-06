import { z } from 'zod'

// Measure Unit Groups validation schemas
export const GetMeasureUnitGroupsInputSchema = z.object({})

export const CreateMeasureUnitGroupInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    isSystem: z.boolean().optional()
})

export const UpdateMeasureUnitGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit group ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters')
})

export const DeleteMeasureUnitGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit group ID')
})

// Measure Units validation schemas
export const GetMeasureUnitsInputSchema = z.object({
    groupId: z.string().uuid('Invalid UUID format for measure unit group ID').optional()
})

export const GetMeasureUnitInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit ID')
})

export const CreateMeasureUnitInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    shortName: z.string().min(1, 'Short name is required').max(10, 'Short name must be less than 10 characters'),
    measureUnitGroupId: z.string().uuid('Invalid UUID format for measure unit group ID'),
    bmnCode: z.number().int().optional(),
    isBase: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    conversionFactor: z.number().optional()
})

export const UpdateMeasureUnitInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    shortName: z.string().min(1, 'Short name is required').max(10, 'Short name must be less than 10 characters').optional(),
    bmnCode: z.number().int().optional(),
    isBase: z.boolean().optional(),
    conversionFactor: z.number().optional()
})

export const DeleteMeasureUnitInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit ID')
})

