import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeTypesInputSchema } from '../schemas/attributeSchemas'

export async function getAttributeTypes(args: { 
    apiClient: EventlyApiClient
    searchTerm?: string
    page?: number
    pageSize?: number
}): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributeTypesInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.searchTerm) queryParams.append('searchTerm', validatedArgs.searchTerm)
    queryParams.append('page', (validatedArgs.page ?? 1).toString())
    queryParams.append('pageSize', (validatedArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    return await apiClient.get(`/attributevalue/attribute-types${queryString ? `?${queryString}` : ''}`)
}

