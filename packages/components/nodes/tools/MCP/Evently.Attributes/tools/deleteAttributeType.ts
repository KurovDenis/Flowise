import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteAttributeTypeInputSchema } from '../schemas/attributeSchemas'

export async function deleteAttributeType(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteAttributeTypeInputSchema, restArgs)
    await apiClient.delete(`/attribute-types/${validatedArgs.id}`)
    return { success: true, message: 'Attribute type deleted' }
}

