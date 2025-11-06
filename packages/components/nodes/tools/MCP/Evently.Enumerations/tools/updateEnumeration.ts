import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateEnumerationInputSchema } from '../schemas/enumerationSchemas'

export async function updateEnumeration(args: { apiClient: EventlyApiClient; id: string; name: string; description?: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateEnumerationInputSchema, restArgs)
    const { id, ...updateData } = validatedArgs
    return await apiClient.put(`/enumerations/${id}`, updateData)
}

