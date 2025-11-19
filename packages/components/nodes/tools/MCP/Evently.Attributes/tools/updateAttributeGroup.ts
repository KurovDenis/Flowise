import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateAttributeGroupInputSchema } from '../schemas/attributeSchemas'

export async function updateAttributeGroup(args: { apiClient: EventlyApiClient; id: string; [key: string]: any }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateAttributeGroupInputSchema, restArgs)
    const id = validatedArgs.id
    // Remove id from body as it's in the URL
    const { id: _, ...body } = validatedArgs
    return await apiClient.put(`/attributevalue/attribute-groups/${id}`, body)
}

