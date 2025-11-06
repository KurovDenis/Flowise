import { validateInput } from '../validation'
import {
    UpdateEnumerationInputSchema,
    AddEnumerationValueInputSchema,
    UpdateEnumerationValueInputSchema,
    DeleteEnumerationValueInputSchema,
    BatchDeleteEnumerationValuesInputSchema,
    DeleteEnumerationInputSchema
} from '../validation'

describe('Enumeration Management Validation Schemas', () => {
    describe('UpdateEnumerationInputSchema', () => {
        it('should validate correct input with all fields', () => {
            const validInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Enumeration Name',
                description: 'Updated description'
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, validInput)).not.toThrow()
            const result = validateInput(UpdateEnumerationInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should validate correct input without optional description', () => {
            const validInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Enumeration Name'
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, validInput)).not.toThrow()
            const result = validateInput(UpdateEnumerationInputSchema, validInput)
            expect(result.id).toBe(validInput.id)
            expect(result.name).toBe(validInput.name)
        })

        it('should reject missing required id field', () => {
            const invalidInput = {
                name: 'Updated Enumeration Name'
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, invalidInput)).toThrow()
        })

        it('should reject missing required name field', () => {
            const invalidInput = {
                id: '123e4567-e89b-12d3-a456-426614174000'
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, invalidInput)).toThrow()
        })

        it('should reject invalid UUID format for id', () => {
            const invalidInput = {
                id: 'invalid-uuid',
                name: 'Updated Enumeration Name'
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, invalidInput)).toThrow()
        })

        it('should reject empty string for name', () => {
            const invalidInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: ''
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, invalidInput)).toThrow()
        })

        it('should reject name exceeding max length', () => {
            const invalidInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'a'.repeat(201) // Exceeds 200 character limit
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, invalidInput)).toThrow()
        })

        it('should reject description exceeding max length', () => {
            const invalidInput = {
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Enumeration Name',
                description: 'a'.repeat(501) // Exceeds 500 character limit
            }

            expect(() => validateInput(UpdateEnumerationInputSchema, invalidInput)).toThrow()
        })
    })

    describe('AddEnumerationValueInputSchema', () => {
        it('should validate correct input with all fields', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Value Name',
                description: 'Value description',
                order: 5
            }

            expect(() => validateInput(AddEnumerationValueInputSchema, validInput)).not.toThrow()
            const result = validateInput(AddEnumerationValueInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should validate correct input without optional fields', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Value Name'
            }

            expect(() => validateInput(AddEnumerationValueInputSchema, validInput)).not.toThrow()
            const result = validateInput(AddEnumerationValueInputSchema, validInput)
            expect(result.enumerationId).toBe(validInput.enumerationId)
            expect(result.name).toBe(validInput.name)
        })

        it('should reject missing required enumerationId', () => {
            const invalidInput = {
                name: 'New Value Name'
            }

            expect(() => validateInput(AddEnumerationValueInputSchema, invalidInput)).toThrow()
        })

        it('should reject invalid UUID format for enumerationId', () => {
            const invalidInput = {
                enumerationId: 'invalid-uuid',
                name: 'New Value Name'
            }

            expect(() => validateInput(AddEnumerationValueInputSchema, invalidInput)).toThrow()
        })

        it('should reject empty string for name', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                name: ''
            }

            expect(() => validateInput(AddEnumerationValueInputSchema, invalidInput)).toThrow()
        })

        it('should reject negative order value', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                name: 'New Value Name',
                order: -1
            }

            expect(() => validateInput(AddEnumerationValueInputSchema, invalidInput)).toThrow()
        })
    })

    describe('UpdateEnumerationValueInputSchema', () => {
        it('should validate correct input with all fields', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueId: '223e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Value Name',
                description: 'Updated description',
                order: 10
            }

            expect(() => validateInput(UpdateEnumerationValueInputSchema, validInput)).not.toThrow()
            const result = validateInput(UpdateEnumerationValueInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should validate correct input without optional description', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueId: '223e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Value Name',
                order: 10
            }

            expect(() => validateInput(UpdateEnumerationValueInputSchema, validInput)).not.toThrow()
            const result = validateInput(UpdateEnumerationValueInputSchema, validInput)
            expect(result.name).toBe(validInput.name)
            expect(result.order).toBe(validInput.order)
        })

        it('should reject invalid enumerationId', () => {
            const invalidInput = {
                enumerationId: 'invalid-uuid',
                valueId: '223e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Value Name',
                order: 10
            }

            expect(() => validateInput(UpdateEnumerationValueInputSchema, invalidInput)).toThrow()
        })

        it('should reject invalid valueId', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueId: 'invalid-uuid',
                name: 'Updated Value Name',
                order: 10
            }

            expect(() => validateInput(UpdateEnumerationValueInputSchema, invalidInput)).toThrow()
        })

        it('should reject missing required order field', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueId: '223e4567-e89b-12d3-a456-426614174000',
                name: 'Updated Value Name'
            }

            expect(() => validateInput(UpdateEnumerationValueInputSchema, invalidInput)).toThrow()
        })
    })

    describe('DeleteEnumerationValueInputSchema', () => {
        it('should validate correct input', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueId: '223e4567-e89b-12d3-a456-426614174000'
            }

            expect(() => validateInput(DeleteEnumerationValueInputSchema, validInput)).not.toThrow()
            const result = validateInput(DeleteEnumerationValueInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should reject invalid enumerationId', () => {
            const invalidInput = {
                enumerationId: 'invalid-uuid',
                valueId: '223e4567-e89b-12d3-a456-426614174000'
            }

            expect(() => validateInput(DeleteEnumerationValueInputSchema, invalidInput)).toThrow()
        })

        it('should reject invalid valueId', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueId: 'invalid-uuid'
            }

            expect(() => validateInput(DeleteEnumerationValueInputSchema, invalidInput)).toThrow()
        })
    })

    describe('BatchDeleteEnumerationValuesInputSchema', () => {
        it('should validate correct input with multiple valueIds', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueIds: [
                    '223e4567-e89b-12d3-a456-426614174000',
                    '323e4567-e89b-12d3-a456-426614174000',
                    '423e4567-e89b-12d3-a456-426614174000'
                ]
            }

            expect(() => validateInput(BatchDeleteEnumerationValuesInputSchema, validInput)).not.toThrow()
            const result = validateInput(BatchDeleteEnumerationValuesInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should validate correct input with single valueId', () => {
            const validInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueIds: ['223e4567-e89b-12d3-a456-426614174000']
            }

            expect(() => validateInput(BatchDeleteEnumerationValuesInputSchema, validInput)).not.toThrow()
            const result = validateInput(BatchDeleteEnumerationValuesInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should reject empty array', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueIds: []
            }

            expect(() => validateInput(BatchDeleteEnumerationValuesInputSchema, invalidInput)).toThrow()
        })

        it('should reject invalid enumerationId', () => {
            const invalidInput = {
                enumerationId: 'invalid-uuid',
                valueIds: ['223e4567-e89b-12d3-a456-426614174000']
            }

            expect(() => validateInput(BatchDeleteEnumerationValuesInputSchema, invalidInput)).toThrow()
        })

        it('should reject array with invalid UUID', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueIds: ['invalid-uuid']
            }

            expect(() => validateInput(BatchDeleteEnumerationValuesInputSchema, invalidInput)).toThrow()
        })

        it('should reject array with mixed valid and invalid UUIDs', () => {
            const invalidInput = {
                enumerationId: '123e4567-e89b-12d3-a456-426614174000',
                valueIds: ['223e4567-e89b-12d3-a456-426614174000', 'invalid-uuid']
            }

            expect(() => validateInput(BatchDeleteEnumerationValuesInputSchema, invalidInput)).toThrow()
        })
    })

    describe('DeleteEnumerationInputSchema', () => {
        it('should validate correct input', () => {
            const validInput = {
                id: '123e4567-e89b-12d3-a456-426614174000'
            }

            expect(() => validateInput(DeleteEnumerationInputSchema, validInput)).not.toThrow()
            const result = validateInput(DeleteEnumerationInputSchema, validInput)
            expect(result).toEqual(validInput)
        })

        it('should reject invalid UUID format for enumeration ID', () => {
            const invalidInput = {
                id: 'invalid-uuid'
            }

            expect(() => validateInput(DeleteEnumerationInputSchema, invalidInput)).toThrow()
        })

        it('should reject missing required id field', () => {
            const invalidInput = {}

            expect(() => validateInput(DeleteEnumerationInputSchema, invalidInput)).toThrow()
        })
    })
})

