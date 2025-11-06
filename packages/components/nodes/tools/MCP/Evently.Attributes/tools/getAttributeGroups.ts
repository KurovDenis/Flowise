import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeGroupsInputSchema } from '../schemas/attributeSchemas'

export async function getAttributeGroups(args: { apiClient: EventlyApiClient; objectTypeCode?: number; searchTerm?: string; page?: number; pageSize?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributeGroupsInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.objectTypeCode) {
        queryParams.append('objectTypeCode', validatedArgs.objectTypeCode.toString())
    }
    if (validatedArgs.searchTerm) queryParams.append('searchTerm', validatedArgs.searchTerm)
    queryParams.append('page', (validatedArgs.page ?? 1).toString())
    queryParams.append('pageSize', (validatedArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    return await apiClient.get(`/attribute-groups${queryString ? `?${queryString}` : ''}`)
}

