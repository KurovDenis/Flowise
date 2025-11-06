import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeTypesInputSchema } from '../schemas/attributeSchemas'

export async function getAttributeTypes(args: { apiClient: EventlyApiClient }): Promise<any> {
    const { apiClient, ...restArgs } = args
    validateInput(GetAttributeTypesInputSchema, restArgs)
    return await apiClient.get('/attribute-types')
}

