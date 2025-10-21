import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { EventlyCreateAttributeTool } from './core'

class EventlyCreateAttribute_Tools implements INode {
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
        this.label = 'Evently - Create Attribute'
        this.name = 'eventlyCreateAttribute'
        this.version = 1.0
        this.type = 'EventlyCreateAttribute'
        this.icon = 'evently.svg'
        this.category = 'Evently'
        this.description = 'Create a new attribute in Evently system'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(EventlyCreateAttributeTool)]
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
                placeholder: 'Product Name',
                description: 'Attribute name (1-100 characters)',
                optional: false
            },
            {
                label: 'Short Name',
                name: 'shortName',
                type: 'string',
                placeholder: 'ProdName',
                description: 'Short name (1-20 characters)',
                optional: false
            },
            {
                label: 'Code',
                name: 'code',
                type: 'string',
                placeholder: 'PROD_NAME',
                description: 'Unique attribute code (uppercase, underscores)',
                optional: false
            },
            {
                label: 'Data Type',
                name: 'dataType',
                type: 'options',
                options: [
                    { label: 'String', name: 'String' },
                    { label: 'Int', name: 'Int' },
                    { label: 'Decimal', name: 'Decimal' },
                    { label: 'Bool', name: 'Bool' },
                    { label: 'DateTime', name: 'DateTime' },
                    { label: 'Enumeration', name: 'Enumeration' },
                    { label: 'Reference', name: 'Reference' }
                ],
                default: 'String',
                description: 'Data type for the attribute'
            },
            {
                label: 'Description',
                name: 'description',
                type: 'string',
                rows: 3,
                placeholder: 'Detailed description...',
                description: 'Attribute description (optional)',
                optional: true
            },
            {
                label: 'Is Computed',
                name: 'isComputed',
                type: 'boolean',
                default: false,
                description: 'Is this a computed attribute?',
                optional: true
            },
            {
                label: 'Formula Expression',
                name: 'formulaExpression',
                type: 'string',
                placeholder: '[Price] * (1 + [TaxRate])',
                description: 'Formula for computed attributes (if Is Computed = true)',
                optional: true
            }
        ]
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentials = await options.getCredential(nodeData.credential || 'eventlyApi')
        if (!credentials) {
            throw new Error('Evently API credentials not configured')
        }

        const apiUrl = credentials.apiUrl as string
        const token = credentials.token as string

        const tool = new EventlyCreateAttributeTool({
            apiUrl,
            token
        })

        tool.setCredentials(apiUrl, token)
        return tool
    }
}

module.exports = { nodeClass: EventlyCreateAttribute_Tools }

