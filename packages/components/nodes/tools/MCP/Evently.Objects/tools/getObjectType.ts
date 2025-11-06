import { EventlyApiClient, validateInput } from '../../shared'
import { GetObjectTypeInputSchema } from '../schemas/objectSchemas'

export async function getObjectType(args: { apiClient: EventlyApiClient; objectTypeCode: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetObjectTypeInputSchema, restArgs)
    return await apiClient.get(`/object-types/${validatedArgs.objectTypeCode}`)
}

