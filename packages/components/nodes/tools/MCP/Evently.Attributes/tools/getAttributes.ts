import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributesInputSchema } from '../schemas/attributeSchemas'

export async function getAttributes(args: { apiClient: EventlyApiClient; searchTerm?: string; dataType?: string; attributeGroupId?: string; objectTypeCode?: number; isRequired?: boolean; page?: number; pageSize?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributesInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.searchTerm) queryParams.append('searchTerm', validatedArgs.searchTerm)
    if (validatedArgs.dataType) queryParams.append('dataType', validatedArgs.dataType)
    if (validatedArgs.attributeGroupId) queryParams.append('attributeGroupId', validatedArgs.attributeGroupId)
    if (validatedArgs.objectTypeCode) queryParams.append('objectTypeCode', validatedArgs.objectTypeCode.toString())
    if (validatedArgs.isRequired !== undefined) queryParams.append('isRequired', validatedArgs.isRequired.toString())
    queryParams.append('page', (validatedArgs.page ?? 1).toString())
    queryParams.append('pageSize', (validatedArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    return await apiClient.get(`/attributevalue/attributes${queryString ? `?${queryString}` : ''}`)
}

