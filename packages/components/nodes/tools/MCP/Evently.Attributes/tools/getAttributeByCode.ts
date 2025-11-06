import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeByCodeInputSchema } from '../schemas/attributeSchemas'

export async function getAttributeByCode(args: { apiClient: EventlyApiClient; code: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributeByCodeInputSchema, restArgs)
    return await apiClient.get(`/attributes/by-code/${validatedArgs.code}`)
}

