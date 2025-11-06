import { EventlyApiClient, validateInput } from '../../shared'
import { GetObjectTypesInputSchema } from '../schemas/objectSchemas'

export async function getObjectTypes(args: { apiClient: EventlyApiClient; typeKind?: string; isSystem?: boolean; searchTerm?: string; page?: number; pageSize?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetObjectTypesInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.typeKind) queryParams.append('typeKind', validatedArgs.typeKind)
    if (validatedArgs.isSystem !== undefined) queryParams.append('isSystem', validatedArgs.isSystem.toString())
    if (validatedArgs.searchTerm) queryParams.append('searchTerm', validatedArgs.searchTerm)
    queryParams.append('page', (validatedArgs.page ?? 1).toString())
    queryParams.append('pageSize', (validatedArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    return await apiClient.get(`/object-types${queryString ? `?${queryString}` : ''}`)
}

