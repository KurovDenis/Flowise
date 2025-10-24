import { z } from 'zod'

// Validation utility function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
    return schema.parse(data) // Throws ZodError if invalid
}

// AttributeTypes validation schemas
export const GetAttributeTypesInputSchema = z.object({})

export const GetAttributeTypeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute type ID')
})

export const CreateAttributeTypeInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    dataType: z.string().min(1, 'Data type is required')
})

export const UpdateAttributeTypeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute type ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional()
})

export const DeleteAttributeTypeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute type ID')
})

// Attributes validation schemas
export const GetAttributesInputSchema = z.object({
    searchTerm: z.string().optional(),
    dataType: z.string().optional(),
    attributeGroupId: z.string().uuid('Invalid UUID format for attribute group ID').optional(),
    objectTypeCode: z.number().int().positive().optional(),
    isRequired: z.boolean().optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10)
})

export const GetAttributeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute ID')
})

export const CreateAttributeInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    shortName: z.string().min(1, 'Short name is required').max(20, 'Short name must be less than 20 characters'),
    code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
    dataType: z.string().min(1, 'Data type is required'),
    isComputed: z.boolean().default(false),
    isSystemAttribute: z.boolean().default(false),
    isMeasureAble: z.boolean().default(false),
    isReadOnly: z.boolean().default(false),
    formulaExpression: z.string().optional(),
    enumerationId: z.string().uuid('Invalid UUID format for enumeration ID').optional(),
    referenceAttributeId: z.string().uuid('Invalid UUID format for reference attribute ID').optional(),
    targetAttributeId: z.string().uuid('Invalid UUID format for target attribute ID').optional()
})

export const UpdateAttributeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    shortName: z.string().min(1, 'Short name is required').max(20, 'Short name must be less than 20 characters').optional(),
    formulaExpression: z.string().optional()
})

export const DeleteAttributeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute ID')
})

export const GetAttributeShortNamesInputSchema = z.object({
    ids: z.array(z.string().uuid()).min(1, 'At least one ID is required')
})

// AttributeGroups validation schemas
export const GetAttributeGroupsInputSchema = z.object({
    objectTypeCode: z.number().int().positive().optional(),
    searchTerm: z.string().optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10)
})

export const GetAttributeGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute group ID')
})

export const CreateAttributeGroupInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters'),
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0')
})

export const UpdateAttributeGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute group ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional()
})

export const DeleteAttributeGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute group ID')
})

// ObjectTypes validation schemas
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

export const GetRequiredAttributesInputSchema = z.object({
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0')
})

export const RemoveAttributeFromObjectTypeInputSchema = z.object({
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0'),
    attributeId: z.string().uuid('Invalid UUID format for attribute ID')
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

export const CreateSystemObjectInputSchema = z.object({
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

// System Objects validation schemas complete