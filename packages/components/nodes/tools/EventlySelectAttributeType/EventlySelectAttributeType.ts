import { ICommonObject, INode, INodeData, INodeOptionsValue, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import axios from 'axios'

class EventlySelectAttributeType_Tools implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs: INodeParams[]

    constructor() {
        this.label = 'Evently - Select Attribute Type'
        this.name = 'eventlySelectAttributeType'
        this.version = 1.0
        this.type = 'EventlySelectAttributeType'
        this.icon = 'evently.svg'
        this.category = 'Evently'
        this.description = 'Select attribute type from Evently API'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(Object)]
        this.credential = {
            label: 'Evently API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['eventlyApi']
        }
        this.inputs = [
            {
                label: 'Attribute Type',
                name: 'attributeTypeId',
                type: 'asyncOptions',
                loadMethod: 'getAttributeTypesFromEvently',
                description: 'Select an attribute type from Evently'
            }
        ]
    }

    //@ts-ignore
    loadMethods = {
        async getAttributeTypesFromEvently(nodeData: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const credentials = await options.getCredential(nodeData.credential || 'eventlyApi')

            if (!credentials) {
                throw new Error('Evently API credentials not configured')
            }

            const apiUrl = credentials.apiUrl as string
            const token = credentials.token as string

            try {
                const response = await axios.get(`${apiUrl}/api/attributevalue/attribute-types`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 5000,
                    validateStatus: () => true
                })

                if (response.status === 401) {
                    throw new Error('Unauthorized: Invalid or expired JWT token')
                }

                if (response.status === 403) {
                    throw new Error('Forbidden: User does not have permission to read attribute types')
                }

                if (response.status !== 200) {
                    const errorDetail = response.data?.error?.description || response.statusText
                    throw new Error(`HTTP ${response.status}: ${errorDetail}`)
                }

                const result = response.data

                if (!result.isSuccess) {
                    throw new Error(`Evently API error: ${result.error?.description || 'Unknown error'}`)
                }

                const attributeTypes = result.value as Array<{
                    attributeTypeId: string
                    name: string
                    description: string
                    dataType: string
                }>

                return attributeTypes.map((at) => ({
                    label: `${at.name} (${at.dataType})`,
                    name: at.attributeTypeId,
                    description: at.description
                }))
            } catch (error: any) {
                // eslint-disable-next-line no-console
                console.error('[Evently] Failed to load attribute types:', error.message)

                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Cannot connect to Evently API. Is the API running?')
                }

                if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                    throw new Error('Evently API request timed out (> 5 seconds)')
                }

                throw error
            }
        }
    }

    async init(nodeData: INodeData): Promise<any> {
        const attributeTypeId = nodeData.inputs?.attributeTypeId as string
        return attributeTypeId
    }
}

module.exports = { nodeClass: EventlySelectAttributeType_Tools }
