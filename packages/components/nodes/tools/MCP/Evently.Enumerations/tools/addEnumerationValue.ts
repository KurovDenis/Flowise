import { EventlyApiClient, validateInput } from '../../shared'
import { AddEnumerationValueInputSchema } from '../schemas/enumerationSchemas'

export async function addEnumerationValue(args: { apiClient: EventlyApiClient; enumerationId: string; name: string; description?: string; order?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(AddEnumerationValueInputSchema, restArgs)
    const { enumerationId, ...valueData } = validatedArgs
    return await apiClient.post(`/attributevalue/enumerations/${enumerationId}/values`, valueData)
}

