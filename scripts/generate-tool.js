#!/usr/bin/env node

/**
 * Генератор инструментов Evently для Flowise
 * 
 * Usage:
 *   node scripts/generate-tool.js GetAttributes
 *   node scripts/generate-tool.js UpdateAttribute
 */

const fs = require('fs');
const path = require('path');

// Конфигурация инструментов
const TOOL_CONFIGS = {
  GetAttributes: {
    label: 'Evently - Get Attributes',
    description: 'Get list of attributes with optional filters',
    method: 'GET',
    endpoint: '/api/attributevalue/attributes',
    inputs: [
      { name: 'page', type: 'number', default: '1', description: 'Page number', optional: true },
      { name: 'pageSize', type: 'number', default: '20', description: 'Items per page', optional: true },
      { name: 'dataType', type: 'options', options: ['String', 'Int', 'Decimal', 'Bool', 'DateTime'], description: 'Filter by data type', optional: true },
      { name: 'searchTerm', type: 'string', description: 'Search in name or code', optional: true }
    ],
    zodSchema: `z.object({
      page: z.number().optional().default(1),
      pageSize: z.number().optional().default(20),
      dataType: z.enum(['String', 'Int', 'Decimal', 'Bool', 'DateTime', 'Enumeration', 'Reference']).optional(),
      searchTerm: z.string().optional()
    })`,
    executeCode: `
// Build query params
const params = new URLSearchParams();
if (page) params.append('page', page.toString());
if (pageSize) params.append('pageSize', pageSize.toString());
if (dataType) params.append('dataType', dataType);
if (searchTerm) params.append('searchTerm', searchTerm);

const url = \`\${$apiUrl}/api/attributevalue/attributes?\${params.toString()}\`;

const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${$token}\`,
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  throw new Error(\`HTTP \${response.status}: \${await response.text()}\`);
}

const result = await response.json();

if (!result.isSuccess) {
  throw new Error(\`Failed to get attributes: \${result.error?.description}\`);
}

return JSON.stringify({
  success: true,
  data: result.value,
  message: \`Found \${result.value.totalCount} attributes\`
});`
  },
  
  GetAttribute: {
    label: 'Evently - Get Attribute',
    description: 'Get attribute details by ID',
    method: 'GET',
    endpoint: '/api/attributevalue/attributes/{id}',
    inputs: [
      { name: 'attributeId', type: 'string', description: 'Attribute ID (GUID)', optional: false }
    ],
    zodSchema: `z.object({
      attributeId: z.string().uuid('Attribute ID must be a valid GUID')
    })`,
    executeCode: `
const response = await fetch(\`\${$apiUrl}/api/attributevalue/attributes/\${attributeId}\`, {
  method: 'GET',
  headers: {
    'Authorization': \`Bearer \${$token}\`,
    'Content-Type': 'application/json'
  }
});

if (response.status === 404) {
  throw new Error(\`Attribute not found: \${attributeId}\`);
}

if (!response.ok) {
  throw new Error(\`HTTP \${response.status}: \${await response.text()}\`);
}

const result = await response.json();

if (!result.isSuccess) {
  throw new Error(\`Failed to get attribute: \${result.error?.description}\`);
}

return JSON.stringify({
  success: true,
  data: result.value,
  message: \`Attribute: \${result.value.name} (Code: \${result.value.code})\`
});`
  },

  UpdateAttribute: {
    label: 'Evently - Update Attribute',
    description: 'Update existing attribute',
    method: 'PUT',
    endpoint: '/api/attributevalue/attributes/{id}',
    inputs: [
      { name: 'attributeId', type: 'string', description: 'Attribute ID', optional: false },
      { name: 'name', type: 'string', description: 'New name', optional: true },
      { name: 'description', type: 'string', description: 'New description', optional: true }
    ],
    zodSchema: `z.object({
      attributeId: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional()
    })`,
    executeCode: `
const updateData = {};
if (name) updateData.name = name;
if (description) updateData.description = description;

const response = await fetch(\`\${$apiUrl}/api/attributevalue/attributes/\${attributeId}\`, {
  method: 'PUT',
  headers: {
    'Authorization': \`Bearer \${$token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(updateData)
});

if (!response.ok) {
  throw new Error(\`HTTP \${response.status}: \${await response.text()}\`);
}

const result = await response.json();

if (!result.isSuccess) {
  throw new Error(\`Failed to update attribute: \${result.error?.description}\`);
}

return JSON.stringify({
  success: true,
  message: \`Attribute updated successfully\`
});`
  },

  DeleteAttribute: {
    label: 'Evently - Delete Attribute',
    description: 'Delete attribute by ID',
    method: 'DELETE',
    endpoint: '/api/attributevalue/attributes/{id}',
    inputs: [
      { name: 'attributeId', type: 'string', description: 'Attribute ID to delete', optional: false }
    ],
    zodSchema: `z.object({
      attributeId: z.string().uuid()
    })`,
    executeCode: `
const response = await fetch(\`\${$apiUrl}/api/attributevalue/attributes/\${attributeId}\`, {
  method: 'DELETE',
  headers: {
    'Authorization': \`Bearer \${$token}\`,
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  const errorText = await response.text();
  if (errorText.includes('System attributes cannot be deleted')) {
    throw new Error('Cannot delete system attributes');
  }
  throw new Error(\`HTTP \${response.status}: \${errorText}\`);
}

const result = await response.json();

if (!result.isSuccess) {
  throw new Error(\`Failed to delete attribute: \${result.error?.description}\`);
}

return JSON.stringify({
  success: true,
  message: \`Attribute deleted successfully\`
});`
  }
};

// Генерация Node файла
function generateNodeFile(toolName, config) {
  const className = `Evently${toolName}_Tools`;
  
  return `import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { getBaseClasses } from '../../../src/utils'
import { Evently${toolName}Tool } from './core'

class ${className} implements INode {
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
        this.label = '${config.label}'
        this.name = 'evently${toolName}'
        this.version = 1.0
        this.type = 'Evently${toolName}'
        this.icon = 'evently.svg'
        this.category = 'Evently'
        this.description = '${config.description}'
        this.baseClasses = [this.type, 'Tool', ...getBaseClasses(Evently${toolName}Tool)]
        this.credential = {
            label: 'Evently API',
            name: 'credential',
            type: 'credential',
            credentialNames: ['eventlyApi']
        }
        this.inputs = ${JSON.stringify(config.inputs.map(input => ({
          label: input.name.charAt(0).toUpperCase() + input.name.slice(1),
          name: input.name,
          type: input.type,
          ...(input.options && { options: input.options.map(opt => ({ label: opt, name: opt })) }),
          ...(input.default && { default: input.default }),
          description: input.description,
          optional: input.optional
        })), null, 12)}
    }

    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentials = await options.getCredential(nodeData.credential || 'eventlyApi')
        if (!credentials) {
            throw new Error('Evently API credentials not configured')
        }

        const apiUrl = credentials.apiUrl as string
        const token = credentials.token as string

        const tool = new Evently${toolName}Tool({
            apiUrl,
            token
        })

        tool.setCredentials(apiUrl, token)
        return tool
    }
}

module.exports = { nodeClass: ${className} }
`;
}

// Генерация Core файла
function generateCoreFile(toolName, config) {
  const inputsList = config.inputs.map(i => i.name).join(', ');
  
  return `import { z } from 'zod'
import { DynamicStructuredTool } from '../CustomTool/core'
import { executeJavaScriptCode, createCodeExecutionSandbox } from '../../../src/utils'
import { ICommonObject } from '../../../src/Interface'

export interface EventlyToolParameters {
    apiUrl?: string
    token?: string
}

const ${toolName.toLowerCase()}Schema = () => {
    return ${config.zodSchema}
}

export class Evently${toolName}Tool extends DynamicStructuredTool {
    apiUrl: string
    token: string
    protected toolVariables: any[] = []
    protected toolFlowObj: any = null

    constructor(args?: EventlyToolParameters) {
        const schema = ${toolName.toLowerCase()}Schema()

        const toolInput = {
            name: 'evently_${toolName.toLowerCase()}',
            description: '${config.description}',
            schema: schema,
            code: \`
async function execute() {
    const { ${inputsList} } = $input;
    
    try {
        const startTime = Date.now();
        
        ${config.executeCode}
        
    } catch (error) {
        console.error('[Evently] ${toolName} failed:', error.message);
        return JSON.stringify({
            success: false,
            error: error.message
        });
    }
}

return await execute();
            \`
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
`;
}

// Main функция
function main() {
  const toolName = process.argv[2];
  
  if (!toolName) {
    console.error('❌ Error: Tool name required');
    console.log('\nUsage:');
    console.log('  node scripts/generate-tool.js GetAttributes');
    console.log('  node scripts/generate-tool.js UpdateAttribute');
    console.log('\nAvailable tools:');
    Object.keys(TOOL_CONFIGS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }
  
  const config = TOOL_CONFIGS[toolName];
  
  if (!config) {
    console.error(`❌ Error: Tool configuration not found for "${toolName}"`);
    console.log('\nAvailable tools:');
    Object.keys(TOOL_CONFIGS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }
  
  // Создать директорию
  const toolDir = path.join(__dirname, '..', 'packages', 'components', 'nodes', 'tools', `Evently${toolName}`);
  
  if (fs.existsSync(toolDir)) {
    console.log(`⚠️  Warning: Directory already exists: ${toolDir}`);
    console.log('   Overwriting files...');
  } else {
    fs.mkdirSync(toolDir, { recursive: true });
  }
  
  // Создать файлы
  const nodeFile = path.join(toolDir, `Evently${toolName}.ts`);
  const coreFile = path.join(toolDir, 'core.ts');
  const iconFile = path.join(toolDir, 'evently.svg');
  
  fs.writeFileSync(nodeFile, generateNodeFile(toolName, config));
  fs.writeFileSync(coreFile, generateCoreFile(toolName, config));
  
  // Копировать иконку
  const iconSource = path.join(__dirname, '..', 'packages', 'components', 'nodes', 'tools', 'EventlyCreateAttributeType', 'evently.svg');
  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, iconFile);
  }
  
  console.log(`✅ Tool generated successfully: Evently${toolName}`);
  console.log(`   Directory: ${toolDir}`);
  console.log(`   Files:`);
  console.log(`     - Evently${toolName}.ts`);
  console.log(`     - core.ts`);
  console.log(`     - evently.svg`);
  console.log('\n📝 Next steps:');
  console.log('   1. Review generated files');
  console.log('   2. Run: pnpm build');
  console.log('   3. Restart Flowise');
  console.log('   4. Check tool in UI: http://localhost:3005');
}

main();

