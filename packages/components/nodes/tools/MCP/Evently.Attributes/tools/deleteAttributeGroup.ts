import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteAttributeGroupInputSchema } from '../schemas/attributeSchemas'

export async function deleteAttributeGroup(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteAttributeGroupInputSchema, restArgs)
    await apiClient.delete(`/attributevalue/attribute-groups/${validatedArgs.id}`)
    return { success: true, message: 'Attribute group deleted' }
}

