import { EventlyApiClient, validateInput } from '../../shared'
import { CreateAttributeGroupInputSchema } from '../schemas/attributeSchemas'

export async function createAttributeGroup(args: { apiClient: EventlyApiClient; name: string; description: string; objectTypeCode: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateAttributeGroupInputSchema, restArgs)
    return await apiClient.post('/attribute-groups', validatedArgs)
}

