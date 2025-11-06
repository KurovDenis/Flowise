import { EventlyApiClient, validateInput } from '../../shared'
import { CreateEnumerationInputSchema } from '../schemas/enumerationSchemas'

export async function createEnumeration(args: { apiClient: EventlyApiClient; name: string; description?: string; values?: Array<{ name: string; description?: string; order: number }> }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateEnumerationInputSchema, restArgs)
    return await apiClient.post('/enumerations', validatedArgs)
}

