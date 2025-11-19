import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateObjectTypeInputSchema } from '../schemas/objectSchemas'

export async function updateObjectType(args: { apiClient: EventlyApiClient; objectTypeCode: number; name?: string; description?: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateObjectTypeInputSchema, restArgs)
    const { objectTypeCode, ...updateData } = validatedArgs
    return await apiClient.put(`/attributevalue/object-types/${objectTypeCode}`, updateData)
}

