# System Objects MCP Tools Verification Report

## 🎯 Цель проверки
Проверить существование и корректность MCP Tools для System Objects API endpoints согласно плану исправления.

---

## 📊 РЕЗУЛЬТАТЫ ПРОВЕРКИ

### ❌ КРИТИЧЕСКАЯ ПРОБЛЕМА: System Objects tools полностью отсутствуют

**Статус**: 0/5 endpoints реализованы (0%)

**Проблема**: В EventlyMCPServer.ts НЕТ ни одного tool для System Objects

---

## 🔍 ДЕТАЛЬНАЯ ПРОВЕРКА ПО ENDPOINTS

### 5.1 get_system_objects
- **Статус**: ❌ ОТСУТСТВУЕТ
- **Проверка MCP Server**: НЕТ в EventlyMCPServer.ts
- **Проверка API endpoint**: ✅ СУЩЕСТВУЕТ
  - **Endpoint**: `GET /system-objects`
  - **Query**: `GetSystemObjectsQuery(ObjectTypeCode?, ContainerId?, SearchTerm?, Page, PageSize)`
  - **Response**: `PagedResult<SystemObjectListItemResponse>`
  - **Параметры**: 5 параметров (ObjectTypeCode, ContainerId, SearchTerm, Page, PageSize)
- **Действия**: 
  - [ ] **СОЗДАТЬ tool** в EventlyMCPServer.ts
  - [ ] **ДОБАВИТЬ схему валидации** в validation.ts
  - [ ] **РЕАЛИЗОВАТЬ обработчик** в switch case

### 5.2 get_system_object
- **Статус**: ❌ ОТСУТСТВУЕТ
- **Проверка MCP Server**: НЕТ в EventlyMCPServer.ts
- **Проверка API endpoint**: ✅ СУЩЕСТВУЕТ
  - **Endpoint**: `GET /system-objects/{id:guid}`
  - **Query**: `GetSystemObjectQuery(SystemObjectId)`
  - **Response**: `SystemObjectResponse` с полной информацией и значениями атрибутов
- **Действия**: 
  - [ ] **СОЗДАТЬ tool** в EventlyMCPServer.ts
  - [ ] **ДОБАВИТЬ схему валидации** в validation.ts
  - [ ] **РЕАЛИЗОВАТЬ обработчик** в switch case

### 5.3 create_system_object
- **Статус**: ❌ ОТСУТСТВУЕТ
- **Проверка MCP Server**: НЕТ в EventlyMCPServer.ts
- **Проверка API endpoint**: ✅ СУЩЕСТВУЕТ
  - **Endpoint**: `POST /system-objects`
  - **Command**: `CreateSystemObjectWithAttributesCommand(ObjectTypeCode, SchemeCode?, AttributeValues)`
  - **Request**: `{ ObjectTypeCode, SchemeCode?, AttributeValues: AttributeValueDto[] }`
  - **Response**: `Guid` (ID созданного системного объекта)
- **Действия**: 
  - [ ] **СОЗДАТЬ tool** в EventlyMCPServer.ts
  - [ ] **ДОБАВИТЬ схему валидации** в validation.ts
  - [ ] **РЕАЛИЗОВАТЬ обработчик** в switch case

### 5.4 update_system_object
- **Статус**: ❌ ОТСУТСТВУЕТ
- **Проверка MCP Server**: НЕТ в EventlyMCPServer.ts
- **Проверка API endpoint**: ✅ СУЩЕСТВУЕТ
  - **Endpoint**: `PUT /system-objects/{id:guid}`
  - **Command**: `UpdateSystemObjectCommand(SystemObjectId, AttributeValueUpdates)`
  - **Request**: `{ AttributeValueUpdates: AttributeValueUpdateDto[] }`
  - **Response**: `NoContent` (204) при успехе
- **Действия**: 
  - [ ] **СОЗДАТЬ tool** в EventlyMCPServer.ts
  - [ ] **ДОБАВИТЬ схему валидации** в validation.ts
  - [ ] **РЕАЛИЗОВАТЬ обработчик** в switch case

### 5.5 delete_system_object
- **Статус**: ❌ ОТСУТСТВУЕТ
- **Проверка MCP Server**: НЕТ в EventlyMCPServer.ts
- **Проверка API endpoint**: ✅ СУЩЕСТВУЕТ
  - **Endpoint**: `DELETE /system-objects/{id:guid}`
  - **Command**: `DeleteSystemObjectCommand(SystemObjectId)`
  - **Response**: `NoContent` (204) при успехе
- **Действия**: 
  - [ ] **СОЗДАТЬ tool** в EventlyMCPServer.ts
  - [ ] **ДОБАВИТЬ схему валидации** в validation.ts
  - [ ] **РЕАЛИЗОВАТЬ обработчик** в switch case

---

## 📋 ГОТОВЫЕ СХЕМЫ ВАЛИДАЦИИ

### GetSystemObjectsInputSchema
```typescript
export const GetSystemObjectsInputSchema = z.object({
    objectTypeCode: z.number().int().positive().optional(),
    containerId: z.string().uuid('Invalid UUID format for container ID').optional(),
    searchTerm: z.string().max(200, 'Search term must be less than 200 characters').optional(),
    page: z.number().int().positive().default(1),
    pageSize: z.number().int().positive().max(100).default(10)
})
```

### GetSystemObjectInputSchema
```typescript
export const GetSystemObjectInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for system object ID')
})
```

### CreateSystemObjectInputSchema
```typescript
export const CreateSystemObjectInputSchema = z.object({
    objectTypeCode: z.number().int().positive('Object type code must be greater than 0'),
    schemeCode: z.string().uuid('Invalid UUID format for scheme code').optional(),
    attributeValues: z.array(z.object({
        attributeId: z.string().uuid('Invalid UUID format for attribute ID'),
        value: z.any(), // Can be string, number, boolean, etc.
        isComputed: z.boolean().default(false)
    })).min(1, 'At least one attribute value is required')
})
```

### UpdateSystemObjectInputSchema
```typescript
export const UpdateSystemObjectInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for system object ID'),
    attributeValueUpdates: z.array(z.object({
        attributeId: z.string().uuid('Invalid UUID format for attribute ID'),
        value: z.any() // Can be string, number, boolean, etc.
    })).min(1, 'At least one attribute value update is required')
        .max(50, 'Cannot update more than 50 attribute values at once')
})
```

### DeleteSystemObjectInputSchema
```typescript
export const DeleteSystemObjectInputSchema = z.object({
    id: z.string().uuid('Invalid UUID format for system object ID')
})
```

---

## 🔧 ГОТОВЫЕ ОБРАБОТЧИКИ

### GetSystemObjects Handler
```typescript
case 'get_system_objects': {
    const getSystemObjectsArgs = validateInput(GetSystemObjectsInputSchema, args)
    const queryParams = new URLSearchParams()

    if (getSystemObjectsArgs.objectTypeCode) {
        queryParams.append('objectTypeCode', getSystemObjectsArgs.objectTypeCode.toString())
    }
    if (getSystemObjectsArgs.containerId) {
        queryParams.append('containerId', getSystemObjectsArgs.containerId)
    }
    if (getSystemObjectsArgs.searchTerm) {
        queryParams.append('searchTerm', getSystemObjectsArgs.searchTerm)
    }
    queryParams.append('page', (getSystemObjectsArgs.page ?? 1).toString())
    queryParams.append('pageSize', (getSystemObjectsArgs.pageSize ?? 10).toString())

    const queryString = queryParams.toString()
    result = await this.apiClient.get(`/system-objects${queryString ? `?${queryString}` : ''}`)
    break
}
```

### GetSystemObject Handler
```typescript
case 'get_system_object': {
    const getSystemObjectArgs = validateInput(GetSystemObjectInputSchema, args)
    result = await this.apiClient.get(`/system-objects/${getSystemObjectArgs.id}`)
    break
}
```

### CreateSystemObject Handler
```typescript
case 'create_system_object': {
    const createSystemObjectArgs = validateInput(CreateSystemObjectInputSchema, args)
    result = await this.apiClient.post('/system-objects', createSystemObjectArgs)
    break
}
```

### UpdateSystemObject Handler
```typescript
case 'update_system_object': {
    const updateSystemObjectArgs = validateInput(UpdateSystemObjectInputSchema, args)
    const { id, ...updateData } = updateSystemObjectArgs
    result = await this.apiClient.put(`/system-objects/${id}`, updateData)
    break
}
```

### DeleteSystemObject Handler
```typescript
case 'delete_system_object': {
    const deleteSystemObjectArgs = validateInput(DeleteSystemObjectInputSchema, args)
    await this.apiClient.delete(`/system-objects/${deleteSystemObjectArgs.id}`)
    result = { success: true, message: 'System object deleted' }
    break
}
```

---

## 📝 ГОТОВЫЕ TOOL DEFINITIONS

### GetSystemObjects Tool
```typescript
{
    name: 'get_system_objects',
    description: 'Get all system objects from Evently API with filtering and pagination',
    inputSchema: {
        type: 'object',
        properties: {
            objectTypeCode: {
                type: 'number',
                description: 'Filter by object type code'
            },
            containerId: {
                type: 'string',
                description: 'Filter by container ID (UUID)'
            },
            searchTerm: {
                type: 'string',
                description: 'Search by values or names'
            },
            page: {
                type: 'number',
                description: 'Page number (starting from 1)',
                default: 1
            },
            pageSize: {
                type: 'number',
                description: 'Page size (maximum 100)',
                default: 10
            }
        }
    }
}
```

### GetSystemObject Tool
```typescript
{
    name: 'get_system_object',
    description: 'Get a specific system object by ID with all attribute values',
    inputSchema: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                description: 'UUID of the system object'
            }
        },
        required: ['id']
    }
}
```

### CreateSystemObject Tool
```typescript
{
    name: 'create_system_object',
    description: 'Create a new system object with attribute values',
    inputSchema: {
        type: 'object',
        properties: {
            objectTypeCode: {
                type: 'number',
                description: 'Object type code for the new system object'
            },
            schemeCode: {
                type: 'string',
                description: 'Optional scheme code (UUID)'
            },
            attributeValues: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        attributeId: {
                            type: 'string',
                            description: 'UUID of the attribute'
                        },
                        value: {
                            description: 'Value for the attribute (can be string, number, boolean, etc.)'
                        },
                        isComputed: {
                            type: 'boolean',
                            description: 'Whether this is a computed attribute',
                            default: false
                        }
                    },
                    required: ['attributeId', 'value']
                },
                description: 'Array of attribute values for the system object'
            }
        },
        required: ['objectTypeCode', 'attributeValues']
    }
}
```

### UpdateSystemObject Tool
```typescript
{
    name: 'update_system_object',
    description: 'Update attribute values of an existing system object',
    inputSchema: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                description: 'UUID of the system object'
            },
            attributeValueUpdates: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        attributeId: {
                            type: 'string',
                            description: 'UUID of the attribute to update'
                        },
                        value: {
                            description: 'New value for the attribute'
                        }
                    },
                    required: ['attributeId', 'value']
                },
                description: 'Array of attribute value updates (max 50)'
            }
        },
        required: ['id', 'attributeValueUpdates']
    }
}
```

### DeleteSystemObject Tool
```typescript
{
    name: 'delete_system_object',
    description: 'Delete a system object',
    inputSchema: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                description: 'UUID of the system object'
            }
        },
        required: ['id']
    }
}
```

---

## 🎯 ПЛАН РЕАЛИЗАЦИИ

### Этап 1: Добавление схем валидации (30 мин)
1. Добавить все 5 схем валидации в `validation.ts`
2. Импортировать схемы в `EventlyMCPServer.ts`

### Этап 2: Добавление tool definitions (30 мин)
1. Добавить все 5 tool definitions в список tools
2. Проверить корректность описаний и схем

### Этап 3: Добавление обработчиков (45 мин)
1. Добавить все 5 case'ов в switch statement
2. Реализовать логику вызовов API
3. Добавить обработку ошибок

### Этап 4: Тестирование (30 мин)
1. Проверить корректность импортов
2. Протестировать валидацию схем
3. Проверить соответствие API endpoints

---

## ✅ ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После реализации:
- **Покрытие System Objects**: 5/5 endpoints (100%)
- **Корректные схемы валидации** для всех tools
- **Полная поддержка фильтрации и пагинации**
- **Соответствие реальным API контрактам**

**Общее время реализации**: ~2.5 часа

---

## 🚨 КРИТИЧЕСКИЕ ЗАМЕЧАНИЯ

1. **System Objects - самый сложный раздел** - требует работы с массивами атрибутов
2. **Схемы валидации сложные** - множественные вложенные объекты
3. **API endpoints существуют** - все 5 endpoints реализованы в коде
4. **Высокий приоритет** - System Objects критически важны для системы

**Рекомендация**: Начать реализацию с System Objects как наиболее важного и сложного раздела.
