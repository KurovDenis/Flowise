import { z } from 'zod'
import { validateInput } from '../types/validation'

describe('ValidationSuite', () => {
    const testSchema = z.object({
        id: z.string(),
        name: z.string().min(1),
        description: z.string().optional()
    })

    it('should validate correct input', () => {
        const validInput = {
            id: 'test-id',
            name: 'Test Name',
            description: 'Test Description'
        }

        expect(() => validateInput(testSchema, validInput)).not.toThrow()
        const result = validateInput(testSchema, validInput)
        expect(result).toEqual(validInput)
    })

    it('should throw error for invalid input', () => {
        const invalidInput = {
            id: 123, // Should be string
            name: '' // Should be non-empty
        }

        expect(() => validateInput(testSchema, invalidInput)).toThrow()
    })

    it('should throw error for missing required fields', () => {
        const invalidInput = {
            name: 'Test Name'
            // Missing required 'id' field
        }

        expect(() => validateInput(testSchema, invalidInput)).toThrow()
    })

    it('should accept optional fields', () => {
        const validInput = {
            id: 'test-id',
            name: 'Test Name'
            // description is optional
        }

        expect(() => validateInput(testSchema, validInput)).not.toThrow()
        const result = validateInput(testSchema, validInput)
        expect(result.description).toBeUndefined()
    })
})
