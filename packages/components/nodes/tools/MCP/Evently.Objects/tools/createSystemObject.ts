import { EventlyApiClient, validateInput } from '../../shared'
import { CreateSystemObjectInputSchema } from '../schemas/objectSchemas'

export async function createSystemObject(args: { apiClient: EventlyApiClient; objectTypeCode: number; schemeCode?: string; attributeValues: Array<{ attributeId: string; value: any; isComputed?: boolean }> }): Promise<any> {
    const { apiClient, ...restArgs } = args
    const validatedArgs = validateInput(CreateSystemObjectInputSchema, restArgs)
    return await apiClient.post('/attributevalue/system-objects', validatedArgs)
}

