import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteMeasureUnitGroupInputSchema } from '../schemas/measureSchemas'

export async function deleteMeasureUnitGroup(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteMeasureUnitGroupInputSchema, restArgs)
    return await apiClient.delete(`/measure-unit-groups/${validatedArgs.id}`)
}

