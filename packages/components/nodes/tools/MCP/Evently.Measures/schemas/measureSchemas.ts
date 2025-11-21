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
    shortName: z.string().min(1, 'Short name is required').max(20, 'Short name must be less than 20 characters'),
    measureUnitGroupId: z.string().uuid('Invalid UUID format for measure unit group ID'),
    bmnCode: z.number().int().optional(),
    isBase: z.boolean().optional(),
    isSystem: z.boolean().optional(),
    isCalendar: z.boolean().optional(),
    conversionFactor: z.number().optional(),
    systemName: z.string().max(100, 'System name must be less than 100 characters').optional(),
    internationalCode: z.string().max(20, 'International code must be less than 20 characters').optional()
})

export const UpdateMeasureUnitInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    shortName: z.string().min(1, 'Short name is required').max(20, 'Short name must be less than 20 characters').optional(),
    bmnCode: z.number().int().optional(),
    isBase: z.boolean().optional(),
    isCalendar: z.boolean().optional(),
    conversionFactor: z.number().optional(),
    systemName: z.string().max(100, 'System name must be less than 100 characters').optional(),
    internationalCode: z.string().max(20, 'International code must be less than 20 characters').optional()
})

export const DeleteMeasureUnitInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for measure unit ID')
})

export const ConvertMeasureUnitInputSchema = z.object({
    sourceUnitId: z.string().uuid('Invalid UUID format for source unit ID'),
    targetUnitId: z.string().uuid('Invalid UUID format for target unit ID'),
    value: z.number().positive('Value must be positive')
})

