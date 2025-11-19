# Evently SGR MCP: Решение проблемы инициализации LLM API Key

## Проблема

### До исправления

**Другие MCP ноды (Enumerations, Attributes, Objects и т.д.):**
- ✅ Инициализируются только с Evently API credentials (Keycloak)
- ✅ Передают credentials через environment variables
- ✅ MCP сервер запускается без ошибок
- ✅ Не требуют дополнительных параметров при инициализации

**Evently SGR (до исправления):**
- ❌ Требовал LLM API key при инициализации в `getTools()`
- ❌ При инициализации `options.chatModel` еще не содержал загруженные credentials
- ❌ Падал с ошибкой: `"LLM API key is required"`
- ❌ Не давал возможности использовать ноду

### Почему так происходило

1. При инициализации инструмента в агенте Flowise еще не передает инициализированную модель в `options.chatModel`
2. `options.agentModelConfig` содержит только конфигурацию (`modelName`, `basepath`), но не API key
3. API key находится в credential `ChatOpenRouter`, который еще не загружен в этот момент
4. В `EventlySGRMCP.ts` была жесткая проверка:

```typescript
if (!apiKey) {
    throw new Error('LLM API key is required...')
}
```

## Решение

### Изменения в EventlySGRMCP.ts

**Было:**
```typescript
// Неправильно пытались получить API key из options.chatModel напрямую
apiKey = chatModel?.openAIApiKey || chatModel?.apiKey

// Или из options.chatModel.credential (который еще не загружен)
if (!apiKey && options?.chatModel?.credential) {
    const credentialData = await getCredentialData(options.chatModel.credential, options)
    // ...
}

// Жесткая проверка при инициализации
if (!apiKey) {
    throw new Error('LLM API key is required...')
}
```

**Стало:**
```typescript
// Правильно получаем credential ID из agentModelConfig (стандартный Flowise паттерн)
const credentialId = modelConfig['FLOWISE_CREDENTIAL_ID']
if (credentialId && !apiKey) {
    const credentialData = await getCredentialData(credentialId, options)
    apiKey = getCredentialParam('openRouterApiKey', credentialData, nodeData) || ...
}

// API key опциональный при инициализации
if (!apiKey) {
    console.log('⚠️  Evently SGR MCP: LLM API key not found. SGR tools will fail until key is provided.')
}
```

### Архитектура проверки API Key

Теперь проверка API key происходит в правильном месте - при фактическом использовании:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. EventlySGRMCP.ts (Flowise Node)                             │
│    - Пытается получить API key из разных источников            │
│    - Если не найден → выводит WARNING, но НЕ падает            │
│    - Передает API key (или undefined) через env vars           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. server.ts (MCP Server Entry Point)                          │
│    - Читает API key из env vars (может быть undefined)         │
│    - Если нет → выводит WARNING, но запускается                │
│    - Передает API key (или undefined) в EventlySGRServer       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. EventlySGRServer.ts (MCP Server Implementation)             │
│    - Принимает apiKey?: string (опциональный параметр)         │
│    - Хранит API key в приватном поле                           │
│    - ❗ ПРОВЕРКА происходит только в getSgrEngine()             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. getSgrEngine() - вызывается при использовании SGR tools     │
│    if (!this.apiKey) {                                          │
│        throw new Error('API key is required for SGR...')        │
│    }                                                             │
│    return new SGRDecisionEngine(...)                            │
└─────────────────────────────────────────────────────────────────┘
```

## Результат

### Поведение после исправления

**✅ Инициализация:**
- Нода успешно инициализируется без API key
- Tools регистрируются в системе
- Выводится предупреждение в консоль
- Соответствует паттерну других MCP нод

**✅ Использование:**
- При попытке вызвать SGR tool без API key → понятная ошибка
- При наличии API key → все работает корректно
- Ошибка происходит в нужный момент (runtime, а не initialization)

**✅ UX:**
- Пользователь видит ноду в списке доступных
- Может настроить агента с этой нодой
- Получает понятную ошибку при попытке использования без API key
- Может добавить API key позже и все заработает

## Сравнение с другими нодами

| Аспект | Enumerations/Attributes | Evently SGR (после fix) |
|--------|------------------------|-------------------------|
| **Обязательные credentials** | Keycloak (Evently API) | Keycloak (Evently API) |
| **Опциональные credentials** | - | LLM API key |
| **Инициализация без LLM key** | ✅ Успешно | ✅ Успешно |
| **Проверка credentials** | При инициализации | Keycloak - при инициализации<br>LLM - при использовании |
| **Сообщение об ошибке** | Четкое | Четкое |

## Файлы, задействованные в исправлении

1. **EventlySGRMCP.ts** - убрана жесткая проверка API key при инициализации
2. **server.ts** - уже корректно обрабатывал опциональный API key
3. **EventlySGRServer.ts** - уже корректно проверял API key в getSgrEngine()
4. **SGRDecisionEngine.ts** - не изменялся (требует обязательный API key в конструкторе, что правильно)

## Тестирование

### Сценарий 1: Инициализация без API key
```
✅ Нода инициализируется
✅ Tools регистрируются
✅ Выводится предупреждение
```

### Сценарий 2: Попытка использования без API key
```
✅ Выдается понятная ошибка:
   "API key is required for SGR Decision Engine. 
    Please configure it in the agent node (chat model credential) 
    or set LLM_API_KEY environment variable."
```

### Сценарий 3: Использование с API key
```
✅ Все работает корректно
✅ SGR Decision Engine инициализируется
✅ Запросы к LLM выполняются
```

## Заключение

Теперь **Evently SGR MCP** работает по тому же принципу, что и другие MCP ноды:
- **Инициализация** - проверяются только критически необходимые credentials (Keycloak)
- **Использование** - проверяются дополнительные credentials (LLM API key)
- **UX** - пользователь может настроить ноду и получить понятную ошибку при отсутствии опциональных credentials

