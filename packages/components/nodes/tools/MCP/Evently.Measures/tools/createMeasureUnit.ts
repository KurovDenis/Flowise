import { EventlyApiClient, validateInput } from '../../shared'
import { CreateMeasureUnitInputSchema } from '../schemas/measureSchemas'

export async function createMeasureUnit(args: { apiClient: EventlyApiClient; name: string; shortName: string; measureUnitGroupId: string; bmnCode?: number; isBase?: boolean; isSystem?: boolean; conversionFactor?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateMeasureUnitInputSchema, restArgs)
    return await apiClient.post('/attributevalue/measure-units', validatedArgs)
}

