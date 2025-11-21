import { EventlyApiClient, validateInput } from '../../shared'
import { UpdateMeasureUnitInputSchema } from '../schemas/measureSchemas'

export async function updateMeasureUnit(args: { apiClient: EventlyApiClient; id: string; name?: string; shortName?: string; bmnCode?: number; isBase?: boolean; isCalendar?: boolean; conversionFactor?: number; systemName?: string; internationalCode?: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(UpdateMeasureUnitInputSchema, restArgs)
    const { id, ...updateData } = validatedArgs
    return await apiClient.put(`/attributevalue/measure-units/${id}`, updateData)
}

