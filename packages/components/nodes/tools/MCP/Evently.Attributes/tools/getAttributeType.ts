import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeTypeInputSchema } from '../schemas/attributeSchemas'

export async function getAttributeType(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributeTypeInputSchema, restArgs)
    return await apiClient.get(`/attributevalue/attribute-types/${validatedArgs.id}`)
}

