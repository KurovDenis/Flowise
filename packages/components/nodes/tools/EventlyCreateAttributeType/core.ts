import { z } from 'zod'
import { DynamicStructuredTool } from '../CustomTool/core'
import { executeJavaScriptCode, createCodeExecutionSandbox } from '../../../src/utils'
import { ICommonObject } from '../../../src/Interface'

export interface EventlyToolParameters {
    apiUrl?: string
    token?: string
}

// Zod схема для валидации входных параметров
const createEventlyAttributeTypeSchema = () => {
    return z.object({
        name: z
            .string()
            .min(3, 'Name must be at least 3 characters')
            .max(200, 'Name cannot exceed 200 characters')
            .describe('Attribute type name'),
        description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional().describe('Attribute type description'),
        dataType: z.enum(['String', 'Integer', 'Decimal', 'Boolean', 'Date']).describe('Data type for the attribute')
    })
}

export class EventlyCreateAttributeTypeTool extends DynamicStructuredTool {
    apiUrl: string
    token: string
    protected toolVariables: any[] = []
    protected toolFlowObj: any = null

    constructor(args?: EventlyToolParameters) {
        const schema = createEventlyAttributeTypeSchema()

        const toolInput = {
            name: 'evently_create_attribute_type',
            description:
                'Create a new attribute type in Evently system. Use this tool when you need to define a new type of attribute that can be used to store data.',
            schema: schema,
            code: `
// Evently Create Attribute Type Tool
async function execute() {
    const { name, description, dataType } = $input;
    
    // Валидация входных данных
    if (!name || name.trim().length === 0) {
        throw new Error('Name is required');
    }
    
    if (name.length < 3) {
        throw new Error('Name must be at least 3 characters');
    }
    
    if (name.length > 200) {
        throw new Error('Name cannot exceed 200 characters');
    }
    
    if (description && description.length > 1000) {
        throw new Error('Description cannot exceed 1000 characters');
    }
    
    const validDataTypes = ['String', 'Integer', 'Decimal', 'Boolean', 'Date'];
    if (!dataType || !validDataTypes.includes(dataType)) {
        throw new Error('Data Type must be one of: String, Integer, Decimal, Boolean, Date');
    }
    
    try {
        const startTime = Date.now();
        
        // Вызов Evently API
        const response = await fetch(\`\${$apiUrl}/api/attributevalue/attribute-types\`, {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${$token}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name.trim(),
                description: description || '',
                dataType: dataType
            })
        });
        
        const latency = Date.now() - startTime;
        console.log(\`[Evently] Create attribute type latency: \${latency}ms\`);
        
        // Обработка ошибок авторизации
        if (response.status === 401) {
            throw new Error('Unauthorized: Token expired or invalid');
        }
        
        if (response.status === 403) {
            throw new Error('Forbidden: No permission to create attribute types');
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorDetail = 'Unknown error';
            
            try {
                const errorData = JSON.parse(errorText);
                errorDetail = errorData?.error?.description || errorText;
            } catch {
                errorDetail = errorText;
            }
            
            throw new Error(\`HTTP \${response.status}: \${errorDetail}\`);
        }
        
        // Парсинг Result<Guid>
        const result = await response.json();
        
        if (!result.isSuccess) {
            // Evently вернула ошибку валидации
            const error = result.error;
            
            if (error.type === 'Validation') {
                throw new Error(\`Validation failed: \${error.description}\`);
            }
            
            throw new Error(\`Failed to create attribute type: \${error.description}\`);
        }
        
        // Возвращаем результат в стандартном формате Flowise
        return JSON.stringify({
            success: true,
            attributeTypeId: result.value,
            message: \`Attribute type "\${name}" created successfully with ID: \${result.value}\`,
            latency: latency
        });
        
    } catch (error) {
        console.error('[Evently] Failed to create attribute type:', error.message);
        
        // Возвращаем ошибку в стандартном формате
        return JSON.stringify({
            success: false,
            error: error.message,
            message: \`Failed to create attribute type "\${name}": \${error.message}\`
        });
    }
}

return await execute();
            `
        }

        super(toolInput)
        this.apiUrl = args?.apiUrl || ''
        this.token = args?.token || ''
    }

    setCredentials(apiUrl: string, token: string) {
        this.apiUrl = apiUrl
        this.token = token
    }

    setVariables(variables: any[]) {
        this.toolVariables = variables
    }

    setFlowObject(flow: any) {
        this.toolFlowObj = flow
    }

    // Переопределяем _call для передачи credentials в sandbox
    protected async _call(
        arg: any,
        _?: any,
        flowConfig?: { sessionId?: string; chatId?: string; input?: string; state?: ICommonObject }
    ): Promise<string> {
        // Создаем дополнительные переменные для sandbox
        const additionalSandbox: ICommonObject = {
            $apiUrl: this.apiUrl,
            $token: this.token,
            $input: arg
        }

        // Подготавливаем flow объект для sandbox
        const flow = this.toolFlowObj ? { ...this.toolFlowObj, ...flowConfig } : {}

        // Создаем sandbox с credentials
        const sandbox = createCodeExecutionSandbox('', this.toolVariables || [], flow, additionalSandbox)

        // Выполняем JavaScript код
        let response = await executeJavaScriptCode(this.code, sandbox)

        if (typeof response === 'object') {
            response = JSON.stringify(response)
        }

        return response
    }
}
