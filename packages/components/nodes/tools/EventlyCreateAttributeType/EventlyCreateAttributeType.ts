import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { EventlyCreateAttributeTypeTool } from './core'

class EventlyCreateAttributeType_Tools implements INode {
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
        this.label = 'Evently - Create Attribute Type'
        this.name = 'eventlyCreateAttributeType'
        this.version = 2.0
        this.type = 'EventlyCreateAttributeType'
        this.icon = 'evently.svg'
        this.category = 'Evently'
        this.description = 'Create a new attribute type in Evently system with proper validation and error handling'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(EventlyCreateAttributeTypeTool)]
        this.credential = {
            label: 'Evently API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['eventlyApi']
        }
        this.inputs = [
            {
                label: 'Name',
                name: 'name',
                type: 'string',
                placeholder: 'Product Price',
                description: 'Attribute type name (3-200 characters)',
                optional: false
            },
            {
                label: 'Description',
                name: 'description',
                type: 'string',
                rows: 4,
                placeholder: 'Detailed description...',
                description: 'Attribute type description (max 1000 characters)',
                optional: true
            },
            {
                label: 'Data Type',
                name: 'dataType',
                type: 'options',
                options: [
                    { label: 'String', name: 'String' },
                    { label: 'Integer', name: 'Integer' },
                    { label: 'Decimal', name: 'Decimal' },
                    { label: 'Boolean', name: 'Boolean' },
                    { label: 'Date', name: 'Date' }
                ],
                default: 'String',
                description: 'Data type for the attribute'
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        // Получить credentials
        const credentials = await options.getCredential(nodeData.credential || 'eventlyApi')
        if (!credentials) {
            throw new Error('Evently API credentials not configured')
        }

        const apiUrl = credentials.apiUrl as string
        const token = credentials.token as string

        // Создать экземпляр тулза с credentials
        const tool = new EventlyCreateAttributeTypeTool({
            apiUrl,
            token
        })

        // Установить credentials для выполнения
        tool.setCredentials(apiUrl, token)

        return tool
    }
}

module.exports = { nodeClass: EventlyCreateAttributeType_Tools }
