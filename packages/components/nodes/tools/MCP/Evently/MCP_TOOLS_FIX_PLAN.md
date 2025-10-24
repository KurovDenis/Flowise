# MCP Tools Fix Plan - Evently AttributeValue API

## Обзор проблем
- **Покрытие API**: 16/36 endpoints (44%)
- **Критические проблемы**: Неправильные схемы валидации, отсутствующие endpoints, неполная реализация

---

## 🔧 ПЛАН ИСПРАВЛЕНИЯ ПО КАТЕГОРИЯМ

### 1. ATTRIBUTE TYPES (5/5 endpoints) ✅
**Статус**: Полное покрытие, но требует исправления схем

#### 1.1 get_attribute_types
- **Текущее состояние**: ✅ Работает
- **Проверка API endpoint**: 
  - **Endpoint**: `GET /attribute-types` (без параметров)
  - **Query**: `GetAttributeTypesQuery` - пустой record без параметров
  - **Response**: `IEnumerable<AttributeTypeResponse>` с полями: `AttributeTypeId`, `Name`, `Description`, `DataType`
  - **Handler**: Простой SELECT без WHERE условий, ORDER BY name
- **Анализ**: 
  - ❌ **НЕТ поддержки фильтрации** - endpoint не принимает параметры поиска, пагинации
  - ❌ **НЕТ параметров** - в отличие от GetAttributes и GetObjectTypes, GetAttributeTypes не имеет FilterParameters
  - ✅ **Схема валидации корректна** - пустой объект соответствует API
  - ✅ **API вызов правильный** - `GET /attribute-types`
- **Действия**: 
  - [ ] **НЕ НУЖНО** добавлять параметры фильтрации - API их не поддерживает
  - [ ] **НЕ НУЖНО** обновлять схему валидации - она корректна

#### 1.2 get_attribute_type  
- **Текущее состояние**: ✅ Работает
- **Проверка API endpoint**: 
  - **Endpoint**: `GET /attribute-types/{attributeTypeId:guid}`
  - **Query**: `GetAttributeTypeQuery(Guid AttributeTypeId)` - принимает GUID из URL параметра
  - **Response**: `AttributeTypeResponse` с полями: `AttributeTypeId`, `Name`, `Description`, `DataType`
  - **Handler**: SELECT с WHERE условием по ID, возвращает 404 если не найден
- **Анализ**: 
  - ✅ **Endpoint правильный** - `GET /attribute-types/{id}` с GUID параметром
  - ✅ **Схема валидации корректна** - `id: string` с UUID валидацией
  - ✅ **API вызов правильный** - `GET /attribute-types/${id}`
  - ✅ **Обработка ошибок** - API возвращает 404 если тип атрибута не найден
  - ✅ **Параметр обязательный** - `required: ['id']` соответствует API
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, все проверки пройдены

#### 1.3 create_attribute_type
- **Текущее состояние**: ✅ Работает корректно
- **Проверка API endpoint**: 
  - **Endpoint**: `POST /attribute-types`
  - **Command**: `CreateAttributeTypeCommand(Name, Description, DataType)` - только 3 поля
  - **Request**: `{ Name, Description, DataType }` - все поля обязательные в API
  - **Response**: `Guid` (ID созданного типа атрибута)
  - **Handler**: Создает AttributeType через доменную модель с валидацией
- **Анализ**: 
  - ✅ **Endpoint правильный** - `POST /attribute-types`
  - ✅ **Схема валидации корректна** - соответствует API Request классу
  - ✅ **API вызов правильный** - `POST /attribute-types` с телом запроса
  - ✅ **Поля соответствуют API** - Name, Description, DataType (все обязательные в API)
  - ✅ **Валидация DataType** - API проверяет допустимые типы данных
  - ❌ **НЕПРАВИЛЬНО в плане** - API НЕ имеет полей `code`, `isSystem`, `isActive`
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, план был неверным
  - [ ] **НЕ НУЖНО** добавлять несуществующие поля - API их не поддерживает

#### 1.4 update_attribute_type
- **Текущее состояние**: ❌ Неправильная схема
- **Проверка API endpoint**: 
  - **Endpoint**: `PUT /attribute-types/{attributeTypeId:guid}`
  - **Command**: `UpdateAttributeTypeCommand(AttributeTypeId, Name, Description)` - только 3 поля
  - **Request**: `{ AttributeTypeId, Name, Description }` - все поля обязательные в API
  - **Response**: `NoContent` (204) при успехе
  - **Handler**: Обновляет только Name и Description, НЕ обновляет DataType
- **Анализ**: 
  - ✅ **Endpoint правильный** - `PUT /attribute-types/{id}`
  - ❌ **НЕПРАВИЛЬНАЯ схема** - tool включает `dataType`, но API его НЕ обновляет
  - ❌ **НЕПРАВИЛЬНЫЕ поля** - API НЕ имеет полей `code`, `isSystem`, `isActive`
  - ❌ **Неправильная валидация** - `dataType` не должен быть в схеме
  - ✅ **API вызов правильный** - `PUT /attribute-types/${id}`
- **Действия**: 
  - [ ] **УДАЛИТЬ поле `dataType`** - API его не обновляет
  - [ ] **НЕ НУЖНО** добавлять несуществующие поля - API их не поддерживает
  - [ ] **Обновить схему валидации** - убрать dataType, оставить только id, name, description

#### 1.5 delete_attribute_type
- **Текущее состояние**: ✅ Работает корректно
- **Проверка API endpoint**: 
  - **Endpoint**: `DELETE /attribute-types/{attributeTypeId:guid}`
  - **Command**: `DeleteAttributeTypeCommand(AttributeTypeId)` - только ID
  - **Response**: `NoContent` (204) при успехе
  - **Handler**: Проверяет существование и использование, удаляет если не используется
- **Анализ**: 
  - ✅ **Endpoint правильный** - `DELETE /attribute-types/{id}`
  - ✅ **Схема валидации корректна** - только `id` с UUID валидацией
  - ✅ **API вызов правильный** - `DELETE /attribute-types/${id}`
  - ✅ **Обработка ошибок** - API возвращает 404 если не найден, 400 если используется
  - ✅ **Параметр обязательный** - `required: ['id']` соответствует API
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, все проверки пройдены

---

### 2. ATTRIBUTES (6/6 endpoints) ⚠️
**Статус**: Полное покрытие, но критически неправильные схемы

#### 2.1 get_attributes
- **Текущее состояние**: ❌ Отсутствуют параметры фильтрации
- **Проверка API endpoint**: 
  - **Endpoint**: `GET /attributes` с параметрами фильтрации
  - **Query**: `GetAttributesQuery(SearchTerm, DataType, AttributeGroupId, ObjectTypeCode, IsRequired, Page, PageSize)`
  - **Response**: `PagedResult<AttributeListItemResponse>` с полями: `Id`, `Name`, `ShortName`, `Code`, `DataType`, `IsComputed`, `IsSystemAttribute`
  - **Handler**: Сложный SQL с JOIN'ами и динамическими WHERE условиями
- **Анализ**: 
  - ✅ **API поддерживает фильтрацию** - 7 параметров фильтрации и пагинации
  - ❌ **Tool НЕ поддерживает фильтрацию** - пустая схема `{}`
  - ❌ **Отсутствуют параметры** - SearchTerm, DataType, AttributeGroupId, ObjectTypeCode, IsRequired, Page, PageSize
  - ❌ **Неправильная схема валидации** - пустой объект не соответствует API
  - ✅ **API вызов правильный** - `GET /attributes`
- **Действия**: 
  - [ ] **ДОБАВИТЬ параметры фильтрации** - все 7 параметров из API
  - [ ] **Обновить схему валидации** - добавить все параметры с правильными типами
  - [ ] **Обновить описание** - указать поддержку фильтрации и пагинации

#### 2.2 get_attribute
- **Текущее состояние**: ✅ Работает корректно
- **Проверка API endpoint**: 
  - **Endpoint**: `GET /attributes/{id:guid}`
  - **Query**: `GetAttributeQuery(AttributeId)` - только ID
  - **Response**: `AttributeResponse` с полями: `Id`, `Name`, `ShortName`, `Code`, `DataType`, `IsComputed`, `IsSystemAttribute`, `IsMeasureAble`, `IsReadOnly`, `FormulaExpression`, `EnumerationId`, `ReferenceAttributeId`, `TargetAttributeId`
  - **Handler**: SELECT с JOIN attribute_types, возвращает 404 если не найден
- **Анализ**: 
  - ✅ **Endpoint правильный** - `GET /attributes/{id}` с GUID параметром
  - ✅ **Схема валидации корректна** - `id: string` с UUID валидацией
  - ✅ **API вызов правильный** - `GET /attributes/${id}`
  - ✅ **Обработка ошибок** - API возвращает 404 если атрибут не найден
  - ✅ **Параметр обязательный** - `required: ['id']` соответствует API
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, все проверки пройдены

#### 2.3 create_attribute
- **Текущее состояние**: ❌ Критически неправильная схема
- **Проверка API endpoint**: 
  - **Endpoint**: `POST /attributes`
  - **Command**: `CreateAttributeCommand` с 13 полями: `Name`, `ShortName`, `Code`, `DataType`, `Description`, `IsComputed`, `IsSystemAttribute`, `IsMeasureAble`, `IsReadOnly`, `FormulaExpression`, `EnumerationId`, `ReferenceAttributeId`, `TargetAttributeId`
  - **Request**: Все поля обязательные в API (кроме Description)
  - **Response**: `Guid` (ID созданного атрибута)
  - **Handler**: Сложная логика создания с валидацией уникальности кода
- **Анализ**: 
  - ✅ **Endpoint правильный** - `POST /attributes`
  - ❌ **КРИТИЧЕСКИ НЕПРАВИЛЬНАЯ схема** - tool имеет только 3 поля, API требует 13
  - ❌ **Неправильные поля** - tool имеет `name`, `description`, `attributeTypeId`, API требует `Name`, `ShortName`, `Code`, `DataType`, etc.
  - ❌ **Неправильная валидация** - схема не соответствует API Command
  - ✅ **API вызов правильный** - `POST /attributes`
- **Действия**: 
  - [ ] **ПОЛНОСТЬЮ ПЕРЕПИСАТЬ схему валидации** - добавить все 13 полей из API
  - [ ] **Обновить inputSchema** - заменить на правильные поля
  - [ ] **Обновить описание** - указать все обязательные поля

#### 2.4 update_attribute
- **Текущее состояние**: ❌ Неправильные поля
- **Проверка API endpoint**: 
  - **Endpoint**: `PUT /attributes/{id:guid}`
  - **Command**: `UpdateAttributeCommand(AttributeId, Name?, ShortName?, FormulaExpression?)` - только 4 поля
  - **Request**: `{ Name?, ShortName?, FormulaExpression? }` - все поля опциональные
  - **Response**: `NoContent` (204) при успехе
  - **Handler**: Обновляет только Name, ShortName, FormulaExpression, НЕ обновляет другие поля
- **Анализ**: 
  - ✅ **Endpoint правильный** - `PUT /attributes/{id}`
  - ❌ **НЕПРАВИЛЬНЫЕ поля** - tool включает `description`, `attributeTypeId`, но API их НЕ обновляет
  - ❌ **Отсутствуют правильные поля** - API обновляет `Name`, `ShortName`, `FormulaExpression`
  - ❌ **Неправильная валидация** - схема не соответствует API Command
  - ✅ **API вызов правильный** - `PUT /attributes/${id}`
- **Действия**: 
  - [ ] **ЗАМЕНИТЬ поля** - убрать `description`, `attributeTypeId`, добавить `shortName`, `formulaExpression`
  - [ ] **Обновить схему валидации** - только разрешенные поля: `id`, `name?`, `shortName?`, `formulaExpression?`
  - [ ] **Обновить описание** - указать, что обновляются только основные свойства

#### 2.5 delete_attribute
- **Текущее состояние**: ✅ Работает корректно
- **Проверка API endpoint**: 
  - **Endpoint**: `DELETE /attributes/{id:guid}`
  - **Command**: `DeleteAttributeCommand(AttributeId)` - только ID
  - **Response**: `NoContent` (204) при успехе
  - **Handler**: Проверяет существование, возможность удаления и использование, удаляет если возможно
- **Анализ**: 
  - ✅ **Endpoint правильный** - `DELETE /attributes/{id}`
  - ✅ **Схема валидации корректна** - только `id` с UUID валидацией
  - ✅ **API вызов правильный** - `DELETE /attributes/${id}`
  - ✅ **Обработка ошибок** - API возвращает 404 если не найден, 400 если используется
  - ✅ **Параметр обязательный** - `required: ['id']` соответствует API
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, все проверки пройдены

#### 2.6 get_attribute_short_names
- **Текущее состояние**: ✅ Работает корректно
- **Проверка API endpoint**: 
  - **Endpoint**: `POST /attributes/short-names`
  - **Query**: `GetAttributeShortNamesQuery(AttributeIds)` - массив GUID'ов
  - **Request**: `{ AttributeIds: Guid[] }` - массив ID атрибутов
  - **Response**: `List<AttributeShortNameInfo>` с полями: `AttributeId`, `ShortName`
  - **Handler**: SELECT с WHERE id = ANY(@AttributeIds)
- **Анализ**: 
  - ✅ **Endpoint правильный** - `POST /attributes/short-names`
  - ✅ **Схема валидации корректна** - `ids: array` с UUID валидацией
  - ✅ **API вызов правильный** - `POST /attributes/short-names` с телом запроса
  - ✅ **Обработка ошибок** - API возвращает ошибки при проблемах с БД
  - ✅ **Параметр обязательный** - `required: ['ids']` соответствует API
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, все проверки пройдены

---

### 3. ATTRIBUTE GROUPS (5/5 endpoints) ✅
**Статус**: Полное покрытие, требует проверки схем

#### 3.1 get_attribute_groups
- **Текущее состояние**: ❌ Отсутствуют параметры фильтрации
- **Проверка API endpoint**: 
  - **Endpoint**: `GET /attribute-groups` с параметрами фильтрации
  - **Query**: `GetAttributeGroupsQuery(ObjectTypeCode, SearchTerm, Page, PageSize)` - 4 параметра
  - **Response**: `PagedResult<AttributeGroupListItemResponse>` с полями: `Id`, `Name`, `Description`, `ObjectTypeCode`, `AttributeCount`
  - **Handler**: Сложный SQL с JOIN'ами, динамическими WHERE условиями и GROUP BY
- **Анализ**: 
  - ✅ **API поддерживает фильтрацию** - 4 параметра фильтрации и пагинации
  - ❌ **Tool НЕ поддерживает фильтрацию** - пустая схема `{}`
  - ❌ **Отсутствуют параметры** - ObjectTypeCode, SearchTerm, Page, PageSize
  - ❌ **Неправильная схема валидации** - пустой объект не соответствует API
  - ✅ **API вызов правильный** - `GET /attribute-groups`
- **Действия**: 
  - [ ] **ДОБАВИТЬ параметры фильтрации** - все 4 параметра из API
  - [ ] **Обновить схему валидации** - добавить все параметры с правильными типами
  - [ ] **Обновить описание** - указать поддержку фильтрации и пагинации

#### 3.2 get_attribute_group
- **Текущее состояние**: ✅ Работает корректно
- **Проверка API endpoint**: 
  - **Endpoint**: `GET /attribute-groups/{id:guid}`
  - **Query**: `GetAttributeGroupQuery(AttributeGroupId)` - только ID
  - **Response**: `AttributeGroupResponse` с полями: `Id`, `Name`, `Description`, `ObjectTypeCode`, `Attributes` (коллекция атрибутов)
  - **Handler**: SELECT с JOIN'ами, возвращает 404 если не найден, включает список атрибутов в группе
- **Анализ**: 
  - ✅ **Endpoint правильный** - `GET /attribute-groups/{id}` с GUID параметром
  - ✅ **Схема валидации корректна** - `id: string` с UUID валидацией
  - ✅ **API вызов правильный** - `GET /attribute-groups/${id}`
  - ✅ **Обработка ошибок** - API возвращает 404 если группа не найдена
  - ✅ **Параметр обязательный** - `required: ['id']` соответствует API
- **Действия**: 
  - [ ] **НЕ НУЖНО** - tool работает корректно, все проверки пройдены

#### 3.3 create_attribute_group
- **Текущее состояние**: ❌ Неполная схема
- **Проверка API endpoint**: 
  - **Endpoint**: `POST /attribute-groups`
  - **Command**: `CreateAttributeGroupCommand(Name, Description, ObjectTypeCode)` - 3 поля
  - **Request**: `{ Name, Description, ObjectTypeCode }` - все поля обязательные в API
  - **Response**: `Guid` (ID созданной группы атрибутов)
  - **Handler**: Проверяет существование ObjectType, создает через доменную модель
- **Анализ**: 
  - ✅ **Endpoint правильный** - `POST /attribute-groups`
  - ❌ **НЕПОЛНАЯ схема** - tool имеет только 2 поля, API требует 3
  - ❌ **Отсутствует поле** - `ObjectTypeCode` (обязательное в API)
  - ❌ **Неправильная валидация** - схема не соответствует API Command
  - ✅ **API вызов правильный** - `POST /attribute-groups`
- **Действия**: 
  - [ ] **ДОБАВИТЬ поле `ObjectTypeCode`** - обязательное поле из API
  - [ ] **Обновить схему валидации** - добавить ObjectTypeCode с валидацией
  - [ ] **Обновить описание** - указать, что нужен ObjectTypeCode

#### 3.4 update_attribute_group
- **Текущее состояние**: ✅ Работает
- **Действия**: Нет

#### 3.5 delete_attribute_group
- **Текущее состояние**: ✅ Работает
- **Действия**: Нет

---

### 4. OBJECT TYPES (0/5 endpoints) ❌
**Статус**: Полностью отсутствуют

#### 4.1 get_object_types
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      typeKind?: string,      // "Container" | "Regular"
      isSystem?: boolean,
      searchTerm?: string,
      page?: number,
      pageSize?: number
    }
    ```
  - [ ] Реализовать вызов API: `GET /object-types`

#### 4.2 get_object_type
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ objectTypeCode: number }`
  - [ ] Реализовать вызов API: `GET /object-types/{objectTypeCode}`

#### 4.3 update_object_type
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      objectTypeCode: number,
      name?: string,
      shortName?: string,
      description?: string
    }
    ```
  - [ ] Реализовать вызов API: `PUT /object-types/{objectTypeCode}`

#### 4.4 get_required_attributes
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ objectTypeCode: number }`
  - [ ] Реализовать вызов API: `GET /object-types/{objectTypeCode}/required-attributes`

#### 4.5 remove_attribute_from_object_type
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      objectTypeCode: number,
      attributeId: string  // UUID
    }
    ```
  - [ ] Реализовать вызов API: `DELETE /object-types/{objectTypeCode}/attributes/{attributeId}`

---

### 5. SYSTEM OBJECTS (0/5 endpoints) ❌
**Статус**: Полностью отсутствуют

#### 5.1 get_system_objects
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      objectTypeCode?: number,
      containerId?: string,    // UUID
      searchTerm?: string,
      page?: number,
      pageSize?: number
    }
    ```
  - [ ] Реализовать вызов API: `GET /system-objects`

#### 5.2 get_system_object
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ id: string }` (UUID)
  - [ ] Реализовать вызов API: `GET /system-objects/{id}`

#### 5.3 create_system_object
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      objectTypeCode: number,
      containerId?: string,    // UUID
      attributeValues: Array<{
        attributeId: string,   // UUID
        value: any
      }>
    }
    ```
  - [ ] Реализовать вызов API: `POST /system-objects`

#### 5.4 update_system_object
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      id: string,             // UUID
      attributeValues: Array<{
        attributeId: string,  // UUID
        value: any
      }>
    }
    ```
  - [ ] Реализовать вызов API: `PUT /system-objects/{id}`

#### 5.5 delete_system_object
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ id: string }` (UUID)
  - [ ] Реализовать вызов API: `DELETE /system-objects/{id}`

---

### 6. MEASURE UNITS (0/5 endpoints) ❌
**Статус**: Полностью отсутствуют

#### 6.1 get_measure_units
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ groupId?: string }` (UUID)
  - [ ] Реализовать вызов API: `GET /measure-units`

#### 6.2 get_measure_unit
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ id: string }` (UUID)
  - [ ] Реализовать вызов API: `GET /measure-units/{id}`

#### 6.3 create_measure_unit
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      name: string,
      shortName: string,
      code: string,
      groupId: string,        // UUID
      description?: string,
      isActive?: boolean
    }
    ```
  - [ ] Реализовать вызов API: `POST /measure-units`

#### 6.4 update_measure_unit
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      id: string,             // UUID
      name?: string,
      shortName?: string,
      code?: string,
      description?: string,
      isActive?: boolean
    }
    ```
  - [ ] Реализовать вызов API: `PUT /measure-units/{id}`

#### 6.5 delete_measure_unit
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ id: string }` (UUID)
  - [ ] Реализовать вызов API: `DELETE /measure-units/{id}`

---

### 7. MEASURE UNIT GROUPS (0/5 endpoints) ❌
**Статус**: Полностью отсутствуют

#### 7.1 get_measure_unit_groups
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{}`
  - [ ] Реализовать вызов API: `GET /measure-unit-groups`

#### 7.2 get_measure_unit_group
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ id: string }` (UUID)
  - [ ] Реализовать вызов API: `GET /measure-unit-groups/{id}`

#### 7.3 create_measure_unit_group
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      name: string,
      shortName: string,
      code: string,
      description?: string,
      isActive?: boolean
    }
    ```
  - [ ] Реализовать вызов API: `POST /measure-unit-groups`

#### 7.4 update_measure_unit_group
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации:
    ```typescript
    {
      id: string,             // UUID
      name?: string,
      shortName?: string,
      code?: string,
      description?: string,
      isActive?: boolean
    }
    ```
  - [ ] Реализовать вызов API: `PUT /measure-unit-groups/{id}`

#### 7.5 delete_measure_unit_group
- **Текущее состояние**: ❌ Отсутствует
- **Действия**:
  - [ ] Создать tool
  - [ ] Добавить схему валидации: `{ id: string }` (UUID)
  - [ ] Реализовать вызов API: `DELETE /measure-unit-groups/{id}`

---

## 📋 ПЛАН РЕАЛИЗАЦИИ

### Этап 1: Исправление существующих tools (1-2 дня)
1. **Attributes** - исправить схемы валидации
2. **AttributeTypes** - добавить недостающие поля
3. **AttributeGroups** - добавить параметры фильтрации

### Этап 2: Добавление ObjectTypes (1 день)
1. Создать 5 новых tools для ObjectTypes
2. Реализовать схемы валидации
3. Добавить обработчики в EventlyMCPServer.ts

### Этап 3: Добавление SystemObjects (1 день)
1. Создать 5 новых tools для SystemObjects
2. Реализовать сложные схемы с attributeValues
3. Добавить обработчики в EventlyMCPServer.ts

### Этап 4: Добавление MeasureUnits (1 день)
1. Создать 5 новых tools для MeasureUnits
2. Реализовать схемы валидации
3. Добавить обработчики в EventlyMCPServer.ts

### Этап 5: Добавление MeasureUnitGroups (1 день)
1. Создать 5 новых tools для MeasureUnitGroups
2. Реализовать схемы валидации
3. Добавить обработчики в EventlyMCPServer.ts

### Этап 6: Тестирование (1 день)
1. Тестирование всех 36 endpoints
2. Проверка схем валидации
3. Интеграционное тестирование

---

## 🎯 ОЖИДАЕМЫЙ РЕЗУЛЬТАТ

После выполнения плана:
- **Покрытие API**: 36/36 endpoints (100%)
- **Корректные схемы валидации** для всех tools
- **Полная поддержка фильтрации и пагинации**
- **Соответствие реальным API контрактам**

**Общее время реализации**: 6-7 дней
