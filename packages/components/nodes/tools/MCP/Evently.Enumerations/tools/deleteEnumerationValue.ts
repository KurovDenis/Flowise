import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteEnumerationValueInputSchema } from '../schemas/enumerationSchemas'

export async function deleteEnumerationValue(args: { apiClient: EventlyApiClient; enumerationId: string; valueId: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteEnumerationValueInputSchema, restArgs)
    return await apiClient.delete(`/enumerations/${validatedArgs.enumerationId}/values/${validatedArgs.valueId}`)
}

