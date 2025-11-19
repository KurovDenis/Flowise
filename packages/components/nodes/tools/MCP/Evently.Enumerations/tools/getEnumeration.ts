import { EventlyApiClient, validateInput } from '../../shared'
import { GetEnumerationInputSchema } from '../schemas/enumerationSchemas'

export async function getEnumeration(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetEnumerationInputSchema, restArgs)
    return await apiClient.get(`/attributevalue/enumerations/${validatedArgs.id}`)
}

