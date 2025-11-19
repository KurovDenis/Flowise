import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateAttributeTypeInputSchema } from '../schemas/attributeSchemas'

export async function updateAttributeType(args: { apiClient: EventlyApiClient; id: string; [key: string]: any }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateAttributeTypeInputSchema, restArgs)
    const id = validatedArgs.id
    // Remove id from body as it's in the URL
    const { id: _, ...body } = validatedArgs
    return await apiClient.put(`/attributevalue/attribute-types/${id}`, body)
}

