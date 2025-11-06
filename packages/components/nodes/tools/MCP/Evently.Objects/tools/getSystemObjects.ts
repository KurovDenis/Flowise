import { EventlyApiClient, validateInput } from '../../shared'
import { GetSystemObjectsInputSchema } from '../schemas/objectSchemas'

export async function getSystemObjects(args: { apiClient: EventlyApiClient; objectTypeCode?: number; containerId?: string; searchTerm?: string; page?: number; pageSize?: number }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetSystemObjectsInputSchema, restArgs)
    const queryParams = new URLSearchParams()

    if (validatedArgs.objectTypeCode) queryParams.append('objectTypeCode', validatedArgs.objectTypeCode.toString())
    if (validatedArgs.containerId) queryParams.append('containerId', validatedArgs.containerId)
    if (validatedArgs.searchTerm) queryParams.append('searchTerm', validatedArgs.searchTerm)
    queryParams.append('page', (validatedArgs.page ?? 1).toString())
    queryParams.append('pageSize', (validatedArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    return await apiClient.get(`/system-objects${queryString ? `?${queryString}` : ''}`)
}

