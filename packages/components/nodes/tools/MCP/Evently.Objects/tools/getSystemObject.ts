import { EventlyApiClient, validateInput } from '../../shared'
import { GetSystemObjectInputSchema } from '../schemas/objectSchemas'

export async function getSystemObject(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetSystemObjectInputSchema, restArgs)
    return await apiClient.get(`/system-objects/${validatedArgs.id}`)
}

