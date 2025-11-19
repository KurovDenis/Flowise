// Mock OpenAI before any imports
const mockOpenAICreate = jest.fn()
jest.mock('openai', () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: mockOpenAICreate
                }
            }
        }))
    }
})
import { SGRDecisionEngine } from '../core/SGRDecisionEngine'
import { EventlyApiClient } from '../../shared'
import { AuthManager } from '../../shared'
import { SGRContext } from '../types/sgr-types'
import { NextStep } from '../schemas/sgr-schemas'

describe('SGRDecisionEngine', () => {
    let engine: SGRDecisionEngine
    let mockApiClient: any

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks()
        mockOpenAICreate.mockReset()

        // Mock EventlyApiClient
        mockApiClient = {
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn()
        }

        // Create engine
        engine = new SGRDecisionEngine(mockApiClient, 'test-api-key', 'openai/gpt-4o-mini')
    })

    describe('analyzeIntent', () => {
        it('should analyze intent and return structured decision', async () => {
            const mockDecision: NextStep = {
                reasoning_steps: ['Step 1', 'Step 2'],
                clarification_needed: false,
                decision_type: 'execute_tool',
                tool_name: 'get_enumerations',
                tool_parameters: { page: 1, pageSize: 10 },
                confidence: 'high'
            }

            mockOpenAICreate.mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: JSON.stringify(mockDecision)
                        }
                    }
                ]
            })

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            const result = await engine.analyzeIntent('Show me all enumerations', context)

            expect(result).toEqual(mockDecision)
            expect(result.decision_type).toBe('execute_tool')
            expect(result.tool_name).toBe('get_enumerations')
        })

        it('should return clarification decision when needed', async () => {
            const mockDecision: NextStep = {
                reasoning_steps: ['Step 1', 'Step 2'],
                clarification_needed: true,
                decision_type: 'clarification',
                questions: ['Which enumeration?'],
                unclear_aspects: ['enumerationId'],
                confidence: 'medium'
            }

            mockOpenAICreate.mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: JSON.stringify(mockDecision)
                        }
                    }
                ]
            })

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            const result = await engine.analyzeIntent('Add a value', context)

            expect(result.decision_type).toBe('clarification')
            expect(result.questions).toBeDefined()
        })
    })

    describe('dispatch', () => {
        it('should dispatch clarification decision', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1', 'Step 2'],
                clarification_needed: true,
                decision_type: 'clarification',
                questions: ['Which enumeration?'],
                unclear_aspects: ['enumerationId']
            }

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            const result = await engine.dispatch(decision, context)

            expect(result.status).toBe('clarification_needed')
            expect(result.questions).toEqual(['Which enumeration?'])
        })

        it('should throw error if clarification already used', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1', 'Step 2'],
                clarification_needed: true,
                decision_type: 'clarification',
                questions: ['Which enumeration?']
            }

            const context: SGRContext = {
                clarification_used: true,
                iteration_count: 1
            }

            await expect(engine.dispatch(decision, context)).rejects.toThrow('Anti-cycling: clarification already used')
        })

        it('should dispatch execute_tool decision', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1', 'Step 2'],
                clarification_needed: false,
                decision_type: 'execute_tool',
                tool_name: 'get_enumerations',
                tool_parameters: { page: 1, pageSize: 10 },
                confidence: 'high'
            }

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            mockApiClient.get.mockResolvedValue({
                items: [],
                total: 0
            })

            const result = await engine.dispatch(decision, context)

            expect(result.status).toBe('success')
            expect(result.tool).toBe('get_enumerations')
            expect(mockApiClient.get).toHaveBeenCalledWith('/attributevalue/enumerations?page=1&pageSize=10')
        })

        it('should dispatch task_complete decision', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1', 'Step 2'],
                clarification_needed: false,
                decision_type: 'task_complete'
            }

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            const result = await engine.dispatch(decision, context)

            expect(result.status).toBe('completed')
            expect(result.reasoning).toBe('Step 1 → Step 2')
        })
    })

    describe('executeTool', () => {
        it('should execute get_enumerations tool', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1'],
                clarification_needed: false,
                decision_type: 'execute_tool',
                tool_name: 'get_enumerations',
                tool_parameters: { page: 1, pageSize: 10 }
            }

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            mockApiClient.get.mockResolvedValue({
                items: [{ id: '1', name: 'Status' }],
                total: 1
            })

            const result = await engine.dispatch(decision, context)

            expect(result.status).toBe('success')
            expect(mockApiClient.get).toHaveBeenCalledWith('/attributevalue/enumerations?page=1&pageSize=10')
        })

        it('should execute create_enumeration tool', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1'],
                clarification_needed: false,
                decision_type: 'execute_tool',
                tool_name: 'create_enumeration',
                tool_parameters: {
                    name: 'Status',
                    description: 'Status enumeration',
                    values: [{ name: 'Active', order: 0 }]
                }
            }

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            mockApiClient.post.mockResolvedValue({
                id: '123',
                name: 'Status'
            })

            const result = await engine.dispatch(decision, context)

            expect(result.status).toBe('success')
            expect(mockApiClient.post).toHaveBeenCalledWith('/attributevalue/enumerations', {
                name: 'Status',
                description: 'Status enumeration',
                values: [{ name: 'Active', order: 0 }]
            })
        })

        it('should execute get_enumeration tool with ID in path', async () => {
            const decision: NextStep = {
                reasoning_steps: ['Step 1'],
                clarification_needed: false,
                decision_type: 'execute_tool',
                tool_name: 'get_enumeration',
                tool_parameters: { id: '123e4567-e89b-12d3-a456-426614174000' }
            }

            const context: SGRContext = {
                clarification_used: false,
                iteration_count: 0
            }

            mockApiClient.get.mockResolvedValue({
                id: '123e4567-e89b-12d3-a456-426614174000',
                name: 'Status'
            })

            const result = await engine.dispatch(decision, context)

            expect(result.status).toBe('success')
            expect(mockApiClient.get).toHaveBeenCalledWith('/attributevalue/enumerations/123e4567-e89b-12d3-a456-426614174000')
        })
    })
})

