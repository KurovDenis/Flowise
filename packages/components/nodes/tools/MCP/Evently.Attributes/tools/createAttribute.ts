import { EventlyApiClient, validateInput } from '../../shared'
import { CreateAttributeInputSchema } from '../schemas/attributeSchemas'

export async function createAttribute(args: { apiClient: EventlyApiClient; name: string; shortName: string; code: string; dataType: string; [key: string]: any }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateAttributeInputSchema, restArgs)
    return await apiClient.post('/attributevalue/attributes', validatedArgs)
}

