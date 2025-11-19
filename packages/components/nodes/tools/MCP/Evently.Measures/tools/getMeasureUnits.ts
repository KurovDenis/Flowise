import { EventlyApiClient, validateInput } from '../../shared'
import { GetMeasureUnitsInputSchema } from '../schemas/measureSchemas'

export async function getMeasureUnits(args: { apiClient: EventlyApiClient; groupId?: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetMeasureUnitsInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.groupId) queryParams.append('groupId', validatedArgs.groupId)

    const queryString = queryParams.toString()
    return await apiClient.get(`/attributevalue/measure-units${queryString ? `?${queryString}` : ''}`)
}

