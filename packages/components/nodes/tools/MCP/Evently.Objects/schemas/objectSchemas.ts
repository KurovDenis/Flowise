import { z } from 'zod'

// Object Types validation schemas
export const GetObjectTypesInputSchema = z.object({
    typeKind: z.string().optional(),
    isSystem: z.boolean().optional(),
    searchTerm: z.string().optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10)
})

export const GetObjectTypeInputSchema = z.object({
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0')
})

export const UpdateObjectTypeInputSchema = z.object({
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional()
})

// System Objects validation schemas
export const GetSystemObjectsInputSchema = z.object({
    objectTypeCode: z.number().int().positive().optional(),
    containerId: z.string().uuid('Invalid UUID format for container ID').optional(),
    searchTerm: z.string().max(200, 'Search term must be less than 200 characters').optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10)
})

export const GetSystemObjectInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for system object ID')
})

export const CreateSystemObjectInputSchema = z
    .object({
        objectTypeCode: z.number().int().positive('Object type code must be greater than 0'),
        schemeCode: z.string().uuid('Invalid UUID format for scheme code').optional(),
        attributeValues: z
            .array(
                z.object({
                    attributeId: z.string().uuid('Invalid UUID format for attribute ID'),
                    value: z.any(), // Can be string, number, boolean, etc.
                    isComputed: z.boolean().default(false)
                })
            )
            .min(1, 'At least one attribute value is required')
    })
    .refine(
        (data) => {
            // Value cannot be null for non-computed attributes
            return data.attributeValues.every((av) => av.isComputed || av.value != null)
        },
        {
            message: 'Value cannot be null for non-computed attributes',
            path: ['attributeValues']
        }
    )

export const UpdateSystemObjectInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for system object ID'),
    attributeValueUpdates: z
        .array(
            z.object({
                attributeId: z.string().uuid('Invalid UUID format for attribute ID'),
                value: z.any() // Can be string, number, boolean, etc.
            })
        )
        .min(1, 'At least one attribute value update is required')
        .max(50, 'Cannot update more than 50 attribute values at once')
})

export const DeleteSystemObjectInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for system object ID')
})

