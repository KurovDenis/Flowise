import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteSystemObjectInputSchema } from '../schemas/objectSchemas'

export async function deleteSystemObject(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteSystemObjectInputSchema, restArgs)
    return await apiClient.delete(`/system-objects/${validatedArgs.id}`)
}

