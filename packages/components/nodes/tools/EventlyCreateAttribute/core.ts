import { z } from 'zod'
import { DynamicStructuredTool } from '../CustomTool/core'
import { executeJavaScriptCode, createCodeExecutionSandbox } from '../../../src/utils'
import { ICommonObject } from '../../../src/Interface'

export interface EventlyToolParameters {
    apiUrl?: string
    token?: string
}

// Zod схема валидации
const createAttributeSchema = () => {
    return z.object({
        name: z
            .string()
            .min(1, 'Name is required')
            .max(100, 'Name cannot exceed 100 characters')
            .describe('Attribute name'),
        shortName: z
            .string()
            .min(1, 'Short name is required')
            .max(20, 'Short name cannot exceed 20 characters')
            .describe('Short name for the attribute'),
        code: z
            .string()
            .min(1, 'Code is required')
            .regex(/^[A-Z_]+$/, 'Code must be uppercase with underscores only')
            .describe('Unique attribute code'),
        dataType: z
            .enum(['String', 'Int', 'Decimal', 'Bool', 'DateTime', 'Enumeration', 'Reference'])
            .describe('Data type'),
        description: z.string().optional().describe('Attribute description'),
        isComputed: z.boolean().optional().default(false).describe('Is computed attribute'),
        formulaExpression: z.string().optional().describe('Formula expression for computed attributes')
    })
}

export class EventlyCreateAttributeTool extends DynamicStructuredTool {
    apiUrl: string
    token: string
    protected toolVariables: any[] = []
    protected toolFlowObj: any = null

    constructor(args?: EventlyToolParameters) {
        const schema = createAttributeSchema()

        const toolInput = {
            name: 'evently_create_attribute',
            description:
                'Create a new attribute in Evently. Use this when user wants to create an attribute with specific name, code, and data type.',
            schema: schema,
            code: `
// Evently Create Attribute Tool
async function execute() {
    const { name, shortName, code, dataType, description, isComputed, formulaExpression } = $input;
    
    // Валидация
    if (!name || name.trim().length === 0) {
        throw new Error('Name is required');
    }
    
    if (!shortName || shortName.trim().length === 0) {
        throw new Error('Short name is required');
    }
    
    if (!code || code.trim().length === 0) {
        throw new Error('Code is required');
    }
    
    // Проверка формата кода
    if (!/^[A-Z_]+$/.test(code)) {
        throw new Error('Code must be uppercase with underscores only (e.g., PROD_NAME)');
    }
    
    const validDataTypes = ['String', 'Int', 'Decimal', 'Bool', 'DateTime', 'Enumeration', 'Reference'];
    if (!dataType || !validDataTypes.includes(dataType)) {
        throw new Error(\`Data Type must be one of: \${validDataTypes.join(', ')}\`);
    }
    
    // Если computed, нужна формула
    if (isComputed && !formulaExpression) {
        throw new Error('Formula expression is required for computed attributes');
    }
    
    try {
        const startTime = Date.now();
        
        // Подготовка payload
        const payload = {
            name: name.trim(),
            shortName: shortName.trim(),
            code: code.trim().toUpperCase(),
            dataType: dataType,
            description: description || '',
            isComputed: isComputed || false,
            isMeasureAble: false, // default
            isReadOnly: isComputed || false // computed = read-only
        };
        
        if (isComputed && formulaExpression) {
            payload.formulaExpression = formulaExpression.trim();
        }
        
        console.log('[Evently] Creating attribute with payload:', JSON.stringify(payload, null, 2));
        
        // API call
        const response = await fetch(\`\${$apiUrl}/api/attributevalue/attributes\`, {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${$token}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const latency = Date.now() - startTime;
        console.log(\`[Evently] Create attribute latency: \${latency}ms\`);
        
        // Error handling
        if (response.status === 401) {
            throw new Error('Unauthorized: Token expired or invalid');
        }
        
        if (response.status === 403) {
            throw new Error('Forbidden: No permission to create attributes');
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
        
        // Parse Result<Guid>
        const result = await response.json();
        
        if (!result.isSuccess) {
            const error = result.error;
            
            if (error.code === 'Attribute.CodeNotUnique') {
                throw new Error(\`Attribute code "\${code}" already exists. Please use a different code.\`);
            }
            
            throw new Error(\`Failed to create attribute: \${error.description}\`);
        }
        
        return JSON.stringify({
            success: true,
            attributeId: result.value,
            message: \`✅ Attribute "\${name}" (code: \${code}) created successfully!\\nID: \${result.value}\`,
            data: {
                id: result.value,
                name: name,
                code: code,
                dataType: dataType,
                isComputed: isComputed
            },
            latency: latency
        });
        
    } catch (error) {
        console.error('[Evently] Failed to create attribute:', error.message);
        
        return JSON.stringify({
            success: false,
            error: error.message,
            message: \`❌ Failed to create attribute "\${name}": \${error.message}\`
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

    protected async _call(
        arg: any,
        _?: any,
        flowConfig?: { sessionId?: string; chatId?: string; input?: string; state?: ICommonObject }
    ): Promise<string> {
        const additionalSandbox: ICommonObject = {
            $apiUrl: this.apiUrl,
            $token: this.token,
            $input: arg
        }

        const flow = this.toolFlowObj ? { ...this.toolFlowObj, ...flowConfig } : {}
        const sandbox = createCodeExecutionSandbox('', this.toolVariables || [], flow, additionalSandbox)

        let response = await executeJavaScriptCode(this.code, sandbox)

        if (typeof response === 'object') {
            response = JSON.stringify(response)
        }

        return response
    }
}

