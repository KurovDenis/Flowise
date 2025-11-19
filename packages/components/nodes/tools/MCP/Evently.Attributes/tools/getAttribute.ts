import { EventlyApiClient, validateInput } from '../../shared'
import { GetAttributeInputSchema } from '../schemas/attributeSchemas'

export async function getAttribute(args: { apiClient: EventlyApiClient; id: string }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(GetAttributeInputSchema, restArgs)
    return await apiClient.get(`/attributevalue/attributes/${validatedArgs.id}`)
}

