import { EventlyApiClient, validateInput } from '../../shared'
import { CreateAttributeTypeInputSchema } from '../schemas/attributeSchemas'

export async function createAttributeType(args: { apiClient: EventlyApiClient; name: string; dataType: string; description?: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateAttributeTypeInputSchema, restArgs)
    return await apiClient.post('/attributevalue/attribute-types', validatedArgs)
}

