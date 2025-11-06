import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateSystemObjectInputSchema } from '../schemas/objectSchemas'

export async function updateSystemObject(args: { apiClient: EventlyApiClient; id: string; attributeValueUpdates: Array<{ attributeId: string; value: any }> }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateSystemObjectInputSchema, restArgs)
    const { id, ...updateData } = validatedArgs
    return await apiClient.put(`/system-objects/${id}`, updateData)
}

