import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteAttributeInputSchema } from '../schemas/attributeSchemas'

export async function deleteAttribute(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteAttributeInputSchema, restArgs)
    await apiClient.delete(`/attributevalue/attributes/${validatedArgs.id}`)
    return { success: true, message: 'Attribute deleted' }
}

