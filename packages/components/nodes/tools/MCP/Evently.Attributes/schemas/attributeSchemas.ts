import { z } from 'zod'

// AttributeTypes validation schemas
export const GetAttributeTypesInputSchema = z.object({})

export const GetAttributeTypeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute type ID')
})

export const CreateAttributeTypeInputSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters').optional(),
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

export const GetAttributeByCodeInputSchema = z.object({
    code: z
        .string()
        .min(1, 'Code is required')
        .max(20, 'Code must be less than or equal to 20 characters')
        .regex(
            /^[A-Z][A-Z0-9_]*$/,
            'Code must start with uppercase letter and contain only uppercase letters, numbers, and underscores'
        )
})

export const GetAttributeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute ID')
})

export const CreateAttributeInputSchema = z
    .object({
        name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
        shortName: z
            .string()
            .min(1, 'Short name is required')
            .max(20, 'Short name must be less than 20 characters')
            .regex(
                /^[A-Z][A-Z0-9_]*$/,
                'Short name must start with uppercase letter and contain only uppercase letters, numbers, and underscores'
            ),
        code: z
            .string()
            .min(1, 'Code is required')
            .max(20, 'Code must be less than 20 characters')
            .regex(
                /^[A-Z][A-Z0-9_]*$/,
                'Code must start with uppercase letter and contain only uppercase letters, numbers, and underscores'
            ),
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
    .refine(
        (data) => {
            // If isComputed is true, formulaExpression is required
            if (data.isComputed && !data.formulaExpression) {
                return false
            }
            return true
        },
        {
            message: 'Formula expression is required for computed attributes',
            path: ['formulaExpression']
        }
    )

export const UpdateAttributeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    shortName: z
        .string()
        .min(1, 'Short name is required')
        .max(20, 'Short name must be less than 20 characters')
        .regex(
            /^[A-Z][A-Z0-9_]*$/,
            'Short name must start with uppercase letter and contain only uppercase letters, numbers, and underscores'
        )
        .optional(),
    formulaExpression: z.string().optional()
}).passthrough() // Allow apiClient and other fields to pass through

export const DeleteAttributeInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute ID')
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
    name: z.string().min(1, 'Name is required').max(200, 'Name must be less than 200 characters'),
    description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0')
})

export const UpdateAttributeGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute group ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
    description: z.string().max(500, 'Description must be less than 500 characters').optional()
}).passthrough() // Allow apiClient and other fields to pass through

export const DeleteAttributeGroupInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for attribute group ID')
})

