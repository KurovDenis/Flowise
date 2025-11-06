import { EventlyApiClient, validateInput } from '../../shared'
import { DeleteMeasureUnitInputSchema } from '../schemas/measureSchemas'

export async function deleteMeasureUnit(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(DeleteMeasureUnitInputSchema, restArgs)
    return await apiClient.delete(`/measure-units/${validatedArgs.id}`)
}

