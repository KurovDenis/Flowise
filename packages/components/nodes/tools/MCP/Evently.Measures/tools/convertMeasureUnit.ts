import { EventlyApiClient, validateInput } from '../../shared'
import { ConvertMeasureUnitInputSchema } from '../schemas/measureSchemas'

export async function convertMeasureUnit(args: { apiClient: EventlyApiClient; sourceUnitId: string; targetUnitId: string; value: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(ConvertMeasureUnitInputSchema, restArgs)
    return await apiClient.post('/attributevalue/measure-units/convert', validatedArgs)
}

