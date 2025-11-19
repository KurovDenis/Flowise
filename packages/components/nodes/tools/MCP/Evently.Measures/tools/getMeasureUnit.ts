import { EventlyApiClient, validateInput } from '../../shared'
import { GetMeasureUnitInputSchema } from '../schemas/measureSchemas'

export async function getMeasureUnit(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetMeasureUnitInputSchema, restArgs)
    return await apiClient.get(`/attributevalue/measure-units/${validatedArgs.id}`)
}

