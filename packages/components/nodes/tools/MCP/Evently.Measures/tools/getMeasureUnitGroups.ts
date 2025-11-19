import { EventlyApiClient, validateInput } from '../../shared'
import { GetMeasureUnitGroupsInputSchema } from '../schemas/measureSchemas'

export async function getMeasureUnitGroups(args: { apiClient: EventlyApiClient }): Promise<any> {
    const { apiClient } = args
    validateInput(GetMeasureUnitGroupsInputSchema, {})
    return await apiClient.get('/attributevalue/measure-unit-groups')
}

