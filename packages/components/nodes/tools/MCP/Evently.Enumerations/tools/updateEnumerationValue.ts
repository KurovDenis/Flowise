import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateEnumerationValueInputSchema } from '../schemas/enumerationSchemas'

export async function updateEnumerationValue(args: { apiClient: EventlyApiClient; enumerationId: string; valueId: string; name: string; description?: string; order: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateEnumerationValueInputSchema, restArgs)
    const { enumerationId, valueId, ...updateData } = validatedArgs
    return await apiClient.put(`/enumerations/${enumerationId}/values/${valueId}`, updateData)
}

