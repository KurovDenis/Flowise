import { EventlyApiClient, validateInput } from '../../shared'
import { CreateMeasureUnitGroupInputSchema } from '../schemas/measureSchemas'

export async function createMeasureUnitGroup(args: { apiClient: EventlyApiClient; name: string; isSystem?: boolean }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateMeasureUnitGroupInputSchema, restArgs)
    return await apiClient.post('/measure-unit-groups', validatedArgs)
}

