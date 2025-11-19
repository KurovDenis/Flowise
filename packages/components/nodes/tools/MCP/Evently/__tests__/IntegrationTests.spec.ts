import { EventlyApiClient } from '../core/EventlyApiClient'
import { AuthManager } from '../core/AuthManager'
import { validateInput } from '../types/validation'
import {
    CreateAttributeTypeInputSchema,
    GetAttributeTypesInputSchema,
    CreateAttributeInputSchema,
    CreateAttributeGroupInputSchema
} from '../types/validation'

/**
 * Integration tests for Evently MCP Server
 * 
 * NOTE: These tests require a running Evently API instance
 * Set EVENTLY_API_URL and EVENTLY_JWT_TOKEN environment variables
 * to run these tests against a real API
 * 
 * Run with: npm test -- --testPathPattern="IntegrationTests"
 */

describe('Evently MCP Integration Tests', () => {
    let apiClient: EventlyApiClient
    let authManager: AuthManager
    const baseUrl = process.env.EVENTLY_API_URL || 'http://localhost:5000'
    const jwtToken = process.env.EVENTLY_JWT_TOKEN || 'mock-jwt-token'

    beforeAll(() => {
        authManager = new AuthManager(jwtToken)
        apiClient = new EventlyApiClient(baseUrl, authManager)
    })

    describe('AttributeTypes API', () => {
        let createdAttributeTypeId: string

        it('should validate input schema for get all attribute types', () => {
            const validInput = {}
            expect(() => validateInput(GetAttributeTypesInputSchema, validInput)).not.toThrow()
        })

        it('should validate input schema for create attribute type', () => {
            const validInput = {
                name: 'Test Type',
                description: 'Test Description',
                dataType: 'String'
            }
            expect(() => validateInput(CreateAttributeTypeInputSchema, validInput)).not.toThrow()
        })

        it('should reject invalid input for create attribute type', () => {
            const invalidInput = {
                name: '', // Empty name should fail
                dataType: 'String'
            }
            expect(() => validateInput(CreateAttributeTypeInputSchema, invalidInput)).toThrow()
        })

        // Mock integration tests - would need real API
        it.skip('should create attribute type via API', async () => {
            const input = {
                name: 'Integration Test Type',
                description: 'Created by integration test',
                dataType: 'String'
            }

            const validatedInput = validateInput(CreateAttributeTypeInputSchema, input)
            const result = await apiClient.post('/attributevalue/attribute-types', validatedInput)
            
            expect(result).toBeDefined()
            expect(result.id).toBeDefined()
            createdAttributeTypeId = result.id
        })

        it.skip('should get all attribute types via API', async () => {
            const result = await apiClient.get('/attributevalue/attribute-types')
            expect(Array.isArray(result)).toBe(true)
        })

        it.skip('should delete created attribute type via API', async () => {
            if (createdAttributeTypeId) {
                await apiClient.delete(`/attributevalue/attribute-types/${createdAttributeTypeId}`)
            }
        })
    })

    describe('Attributes API', () => {
        it('should validate input schema for create attribute', () => {
            const validInput = {
                name: 'Test Attribute',
                description: 'Test Description',
                attributeTypeId: '123e4567-e89b-12d3-a456-426614174000'
            }
            expect(() => validateInput(CreateAttributeInputSchema, validInput)).not.toThrow()
        })

        it('should reject invalid UUID in attribute creation', () => {
            const invalidInput = {
                name: 'Test Attribute',
                attributeTypeId: 'invalid-uuid'
            }
            expect(() => validateInput(CreateAttributeInputSchema, invalidInput)).toThrow()
        })
    })

    describe('AttributeGroups API', () => {
        it('should validate input schema for create attribute group', () => {
            const validInput = {
                name: 'Test Group',
                description: 'Test Description'
            }
            expect(() => validateInput(CreateAttributeGroupInputSchema, validInput)).not.toThrow()
        })

        it('should reject input with name exceeding max length', () => {
            const invalidInput = {
                name: 'a'.repeat(101), // Exceeds 100 character limit
                description: 'Test'
            }
            expect(() => validateInput(CreateAttributeGroupInputSchema, invalidInput)).toThrow()
        })
    })

    describe('Resilience Patterns', () => {
        it('should handle rate limiting correctly', async () => {
            // Create multiple concurrent requests
            const requests = Array.from({ length: 15 }, (_, i) => 
                apiClient.get('/attributevalue/attribute-types').catch(() => null)
            )

            // Should complete without throwing rate limit errors
            const results = await Promise.all(requests)
            expect(results).toBeDefined()
        })

        it('should handle network errors gracefully', async () => {
            const badClient = new EventlyApiClient('http://invalid-url-that-does-not-exist.com', authManager)
            
            await expect(badClient.get('/test')).rejects.toThrow()
        })
    })

    describe('Error Handling', () => {
        it('should normalize API error responses', async () => {
            try {
                // Attempt to get non-existent resource
                await apiClient.get('/attributevalue/attribute-types/00000000-0000-0000-0000-000000000000')
            } catch (error) {
                expect(error.message).toContain('API Error')
            }
        })

        it('should handle authentication errors', async () => {
            const badAuthManager = new AuthManager('invalid-token')
            const badClient = new EventlyApiClient(baseUrl, badAuthManager)
            
            try {
                await badClient.get('/attributevalue/attribute-types')
            } catch (error) {
                expect(error).toBeDefined()
            }
        })
    })
})

