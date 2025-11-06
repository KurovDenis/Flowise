import { EventlyApiClient, validateInput } from '../../shared'
import { GetEnumerationsInputSchema } from '../schemas/enumerationSchemas'

export async function getEnumerations(args: { apiClient: EventlyApiClient; searchTerm?: string; page?: number; pageSize?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetEnumerationsInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.searchTerm) queryParams.append('searchTerm', validatedArgs.searchTerm)
    queryParams.append('page', (validatedArgs.page ?? 1).toString())
    queryParams.append('pageSize', (validatedArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    return await apiClient.get(`/enumerations${queryString ? `?${queryString}` : ''}`)
}

