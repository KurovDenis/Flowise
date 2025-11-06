import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateMeasureUnitGroupInputSchema } from '../schemas/measureSchemas'

export async function updateMeasureUnitGroup(args: { apiClient: EventlyApiClient; id: string; name: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateMeasureUnitGroupInputSchema, restArgs)
    const { id, ...updateData } = validatedArgs
    return await apiClient.put(`/measure-unit-groups/${id}`, updateData)
}

