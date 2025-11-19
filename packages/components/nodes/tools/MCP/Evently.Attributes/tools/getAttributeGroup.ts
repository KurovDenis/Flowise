import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeGroupInputSchema } from '../schemas/attributeSchemas'

export async function getAttributeGroup(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributeGroupInputSchema, restArgs)
    return await apiClient.get(`/attributevalue/attribute-groups/${validatedArgs.id}`)
}

