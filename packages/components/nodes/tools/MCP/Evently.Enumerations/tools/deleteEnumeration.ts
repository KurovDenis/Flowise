import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteEnumerationInputSchema } from '../schemas/enumerationSchemas'

export async function deleteEnumeration(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteEnumerationInputSchema, restArgs)
    return await apiClient.delete(`/enumerations/${validatedArgs.id}`)
}

