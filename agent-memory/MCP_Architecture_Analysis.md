# Анализ архитектуры MCP серверов в Flowise

## 📋 Содержание
- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Компоненты системы](#компоненты-системы)
- [Типы транспорта](#типы-транспорта)
- [Система безопасности](#система-безопасности)
- [Кэширование](#кэширование)
- [Интеграция с Agent Workflow](#интеграция-с-agent-workflow)
- [Примеры конфигурации](#примеры-конфигурации)
- [Доступные MCP серверы](#доступные-mcp-серверы)
- [Заключение](#заключение)

## 🎯 Обзор

MCP (Model Context Protocol) серверы в Flowise представляют собой модульную систему инструментов, которые позволяют агентам взаимодействовать с внешними системами и API. Система построена на принципах безопасности, производительности и расширяемости.

## 🏗️ Архитектура

### Основные принципы
- **Модульность**: каждый MCP сервер изолирован и независим
- **Безопасность**: строгая валидация всех конфигураций
- **Производительность**: кэширование и оптимизация соединений
- **Гибкость**: поддержка различных типов транспорта

### Структура директорий
```
packages/components/nodes/tools/MCP/
├── core.ts                    # Ядро MCP системы
├── BraveSearch/              # Поиск в интернете
├── Github/                   # GitHub API
├── PostgreSQL/               # База данных PostgreSQL
├── Teradata/                 # Teradata
├── Slack/                    # Slack интеграция
├── Supergateway/             # Универсальный шлюз
├── SequentialThinking/       # Инструмент мышления
└── CustomMCP/               # Кастомные серверы
```

## 🔧 Компоненты системы

### MCPToolkit (core.ts)

Центральный класс для работы с MCP серверами:

```typescript
export class MCPToolkit extends BaseToolkit {
    tools: Tool[] = []
    _tools: ListToolsResult | null = null
    transport: StdioClientTransport | SSEClientTransport | StreamableHTTPClientTransport | null = null
    client: Client | null = null
    serverParams: StdioServerParameters | any
    transportType: 'stdio' | 'sse'
}
```

#### Ключевые методы:

**createClient()** - создание клиента с транспортом:
```typescript
async createClient(): Promise<Client> {
    const client = new Client({
        name: 'flowise-client',
        version: '1.0.0'
    }, {
        capabilities: {}
    })
    
    // Выбор транспорта в зависимости от типа
    if (this.transportType === 'stdio') {
        transport = new StdioClientTransport(params)
    } else {
        // SSE или StreamableHTTP транспорт
        transport = new SSEClientTransport(baseUrl, options)
    }
    
    await client.connect(transport)
    return client
}
```

**initialize()** - инициализация и получение инструментов:
```typescript
async initialize() {
    if (this._tools === null) {
        this.client = await this.createClient()
        this._tools = await this.client.request({ method: 'tools/list' }, ListToolsResultSchema)
        this.tools = await this.get_tools()
        await this.client.close()
    }
}
```

**get_tools()** - создание LangChain инструментов:
```typescript
async get_tools(): Promise<Tool[]> {
    const toolsPromises = this._tools.tools.map(async (tool: any) => {
        return await MCPTool({
            toolkit: this,
            name: tool.name,
            description: tool.description || '',
            argsSchema: createSchemaModel(tool.inputSchema)
        })
    })
    
    const res = await Promise.allSettled(toolsPromises)
    return res.filter(r => r.status === 'fulfilled').map(r => r.value)
}
```

## 🚀 Типы транспорта

### 1. STDIO (Standard Input/Output)

**Назначение**: Для локальных MCP серверов
**Поддерживаемые команды**: `node`, `npx`, `python`, `python3`, `docker`

**Пример конфигурации**:
```json
{
    "command": "node",
    "args": ["/path/to/mcp-server/dist/index.js"],
    "env": {
        "API_KEY": "your-api-key"
    }
}
```

**Особенности**:
- Прямое взаимодействие через процессы
- Передача переменных окружения
- Высокая производительность для локальных серверов

### 2. SSE (Server-Sent Events)

**Назначение**: Для удаленных HTTP MCP серверов
**Поддержка**: Аутентификация через заголовки, fallback на StreamableHTTP

**Пример конфигурации**:
```json
{
    "url": "https://api.example.com/mcp/sse",
    "headers": {
        "Authorization": "Bearer {{$vars.token}}",
        "Content-Type": "application/json"
    }
}
```

**Особенности**:
- Работа с удаленными серверами
- Поддержка аутентификации
- Автоматический fallback при ошибках

## 🔒 Система безопасности

### Валидация конфигурации серверов

```typescript
export const validateMCPServerConfig = (serverParams: any): void => {
    // Разрешенные команды
    const allowedCommands = ['node', 'npx', 'python', 'python3', 'docker']
    
    if (serverParams.command && !allowedCommands.includes(serverParams.command)) {
        throw new Error(`Command '${serverParams.command}' is not allowed`)
    }
    
    // Валидация аргументов
    if (serverParams.args && Array.isArray(serverParams.args)) {
        validateArgsForLocalFileAccess(serverParams.args)
        validateCommandInjection(serverParams.args)
    }
    
    // Валидация переменных окружения
    if (serverParams.env) {
        validateEnvironmentVariables(serverParams.env)
    }
}
```

### Защита от атак

**1. Доступ к локальным файлам**:
```typescript
const dangerousPatterns = [
    /^\/[^/]/,           // Unix абсолютные пути
    /^[a-zA-Z]:\\/,      // Windows абсолютные пути
    /\.\.\//,            // Traversal атаки
    /^\.\//,             // Текущая директория
    /^~\//,              // Домашняя директория
    /\.(exe|bat|cmd|sh|ps1|vbs|scr|com|pif|dll|sys)$/i
]
```

**2. Инъекция команд**:
```typescript
const dangerousPatterns = [
    /[;&|`$(){}[\]<>]/,  // Shell метасимволы
    /&&|\|\||;;/,        // Цепочки команд
    />>|<<|>/,           // Перенаправления
    /`|\$\(/,            // Подстановка команд
]
```

**3. Опасные переменные окружения**:
```typescript
const dangerousEnvVars = ['PATH', 'LD_LIBRARY_PATH', 'DYLD_LIBRARY_PATH']
```

### Переменные среды безопасности

- `CUSTOM_MCP_SECURITY_CHECK` - включение/отключение проверок безопасности
- `CUSTOM_MCP_PROTOCOL` - принудительное использование SSE протокола

## 💾 Кэширование

### CachePool для MCP

```typescript
export class CachePool {
    activeMCPCache: { [key: string]: any } = {}
    
    async addMCPCache(cacheKey: string, value: any) {
        // Кэширование только в non-queue режиме
        if (process.env.MODE !== MODE.QUEUE) {
            this.activeMCPCache[`mcpCache:${cacheKey}`] = value
        }
    }
    
    async getMCPCache(cacheKey: string): Promise<any | undefined> {
        if (process.env.MODE !== MODE.QUEUE) {
            return this.activeMCPCache[`mcpCache:${cacheKey}`]
        }
        return undefined
    }
}
```

### Особенности кэширования

- **Ключ кэша**: хэш от конфигурации сервера и workspace ID
- **Содержимое**: toolkit и tools в памяти
- **Ограничения**: не работает в queue режиме (Redis)
- **Производительность**: избежание повторной инициализации серверов

## 🔗 Интеграция с Agent Workflow

### Tool_Agentflow класс

```typescript
class Tool_Agentflow implements INode {
    // Поддержка категорий Tools и Tools (MCP)
    async listTools(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
        for (const nodeName in componentNodes) {
            const componentNode = componentNodes[nodeName]
            if (componentNode.category === 'Tools' || componentNode.category === 'Tools (MCP)') {
                returnOptions.push({
                    label: componentNode.label,
                    name: nodeName,
                    imageSrc: componentNode.icon
                })
            }
        }
    }
}
```

### Процесс выполнения

1. **Загрузка инструмента**: Динамический импорт MCP сервера
2. **Инициализация**: Создание toolkit с кэшированием
3. **Выполнение**: Вызов инструмента с аргументами
4. **Обработка результатов**: Парсинг артефактов и обновление состояния
5. **Возврат результата**: Структурированный ответ с состоянием

### Обработка аргументов

```typescript
const parseInputValue = (value: string): any => {
    // Удаление escape символов
    let cleanedValue = value
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\\[/g, '[')
        .replace(/\\\]/g, ']')
    
    // Парсинг JSON если необходимо
    if ((cleanedValue.startsWith('[') && cleanedValue.endsWith(']')) ||
        (cleanedValue.startsWith('{') && cleanedValue.endsWith('}'))) {
        try {
            return JSON.parse(cleanedValue)
        } catch (e) {
            return cleanedValue
        }
    }
    
    return cleanedValue
}
```

## 📋 Примеры конфигурации

### Custom MCP (STDIO)

```json
{
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
}
```

### Remote MCP (SSE)

```json
{
    "url": "https://api.example.com/endpoint/sse",
    "headers": {
        "Authorization": "Bearer {{$vars.token}}",
        "Content-Type": "application/json"
    }
}
```

### С переменными окружения

```json
{
    "command": "docker",
    "args": [
        "run",
        "-i",
        "--rm",
        "-e", "API_TOKEN"
    ],
    "env": {
        "API_TOKEN": "{{$vars.var1}}"
    }
}
```

### С переменными в заголовках

```json
{
    "url": "https://api.example.com/endpoint/sse",
    "headers": {
        "Authorization": "Bearer {{$vars.var1}}",
        "X-Custom-Header": "{{$vars.customValue}}"
    }
}
```

## 🛠️ Доступные MCP серверы

### 1. BraveSearch MCP
- **Назначение**: Поиск в интернете через Brave Search API
- **Транспорт**: STDIO
- **Аутентификация**: API ключ через переменные окружения
- **Конфигурация**: `BRAVE_API_KEY`

### 2. Github MCP
- **Назначение**: Работа с GitHub API
- **Транспорт**: STDIO
- **Аутентификация**: Personal Access Token
- **Конфигурация**: `GITHUB_PERSONAL_ACCESS_TOKEN`

### 3. PostgreSQL MCP
- **Назначение**: Read-only доступ к PostgreSQL базам данных
- **Транспорт**: STDIO
- **Аутентификация**: Connection string
- **Конфигурация**: PostgreSQL URL

### 4. Teradata MCP
- **Назначение**: Работа с Teradata
- **Транспорт**: SSE
- **Аутентификация**: Bearer token или Basic auth
- **Конфигурация**: URL сервера + credentials

### 5. Slack MCP
- **Назначение**: Интеграция со Slack
- **Транспорт**: STDIO
- **Аутентификация**: Slack API токен
- **Конфигурация**: `SLACK_BOT_TOKEN`

### 6. Supergateway MCP
- **Назначение**: Универсальный шлюз для различных API
- **Транспорт**: STDIO
- **Аутентификация**: Настраиваемая
- **Конфигурация**: Аргументы командной строки

### 7. SequentialThinking MCP
- **Назначение**: Инструмент для последовательного мышления
- **Транспорт**: STDIO
- **Аутентификация**: Не требуется
- **Конфигурация**: Встроенная

### 8. CustomMCP
- **Назначение**: Подключение кастомных MCP серверов
- **Транспорт**: STDIO или SSE
- **Аутентификация**: Настраиваемая
- **Конфигурация**: JSON конфигурация

## 🎯 Заключение

### Ключевые преимущества архитектуры

1. **Модульность**: Легкое добавление новых MCP серверов
2. **Безопасность**: Многоуровневая система валидации
3. **Производительность**: Эффективное кэширование и управление соединениями
4. **Гибкость**: Поддержка различных типов транспорта и аутентификации
5. **Интеграция**: Seamless подключение к agent workflow
6. **Расширяемость**: Поддержка переменных и динамических конфигураций

### Рекомендации по использованию

1. **Безопасность**: Всегда включайте проверки безопасности (`CUSTOM_MCP_SECURITY_CHECK=true`)
2. **Кэширование**: Используйте кэширование для часто используемых серверов
3. **Переменные**: Применяйте переменные для динамических конфигураций
4. **Мониторинг**: Отслеживайте производительность и ошибки MCP серверов
5. **Документация**: Ведите документацию по кастомным MCP серверам

### Будущие улучшения

- Поддержка дополнительных типов транспорта
- Расширенная система метрик и мониторинга
- Автоматическое восстановление соединений
- Улучшенная система кэширования для queue режима
- Поддержка кластеризации MCP серверов

---

*Документ создан на основе анализа исходного кода Flowise v1.0*
