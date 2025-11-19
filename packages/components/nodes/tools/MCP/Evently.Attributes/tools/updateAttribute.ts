import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateAttributeInputSchema } from '../schemas/attributeSchemas'

export async function updateAttribute(args: { apiClient: EventlyApiClient; id: string; [key: string]: any }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateAttributeInputSchema, restArgs)
    const id = validatedArgs.id
    if (!id) {
        throw new Error('ID is required for update_attribute')
    }
    // Remove id from body as it's in the URL
    const { id: _, ...body } = validatedArgs
    return await apiClient.put(`/attributevalue/attributes/${id}`, body)
}

