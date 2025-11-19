# Evently SGR MCP - Инструкция по использованию

## Что такое Evently SGR

**SGR (Search-Generate-Refine)** - интеллектуальный инструмент для работы с Evently API, который:
- Анализирует намерения пользователя с помощью LLM
- Автоматически выбирает нужные API endpoints
- Генерирует structured запросы
- Рефайнит результаты для пользователя

## Требования

### Обязательные credentials:

1. **Evently API (Keycloak)** - для доступа к Evently API
   - `keycloakClientId`
   - `keycloakClientSecret`
   - `keycloakTokenUrl`
   - `apiUrl`

### Опциональные (но необходимые для работы SGR):

2. **LLM API Key** - для работы SGR Decision Engine
   - Через Chat Model credential в агенте (ChatOpenRouter)
   - Или через environment variable `LLM_API_KEY`

## Настройка

### Шаг 1: Добавить Evently API credential

1. В Flowise UI перейдите в **Settings → Credentials**
2. Добавьте credential типа **Evently API (Keycloak)**
3. Заполните:
   - Keycloak Client ID
   - Keycloak Client Secret
   - Keycloak Token URL
   - API URL

### Шаг 2: Настроить агента с Chat Model

1. Создайте или откройте агента
2. Добавьте **Chat Model** (например, ChatOpenRouter)
3. Настройте credential с API key
4. Добавьте инструмент **Evently SGR MCP**
5. Выберите созданный ранее Evently API credential

### Альтернативный способ: Environment Variables

Если не хотите использовать Chat Model credential, можно установить env vars:

```bash
LLM_API_KEY=your-api-key
LLM_MODEL=openai/gpt-4o-mini  # опционально
LLM_BASE_URL=https://openrouter.ai/api/v1  # опционально
```

## Использование

### ✅ С LLM API Key (полная функциональность)

```
User: "Найди все атрибуты типа String для сущности User"
Agent: [использует SGR Decision Engine для анализа и выполнения запроса]
```

### ⚠️ Без LLM API Key

Нода успешно инициализируется, но при попытке использования SGR tools вы получите ошибку:

```
Error: API key is required for SGR Decision Engine. 
Please configure it in the agent node (chat model credential) 
or set LLM_API_KEY environment variable.
```

**Решение:** Добавьте Chat Model credential или установите env var `LLM_API_KEY`

## Доступные tools

SGR предоставляет интеллектуальные инструменты для работы с:
- Attributes (атрибуты)
- Enumerations (перечисления)
- Objects (объекты)
- Events (события)

Полный список tools можно увидеть в логах при инициализации:
```
Evently SGR MCP: Initialized with N tools
```

## Отладка

### Включить debug логи

Все важные события логируются в консоль:

```
✅ Evently SGR MCP: Got API key from chatModel
✅ Evently SGR MCP: Got model from chatModel: openai/gpt-4o-mini
✅ Evently SGR MCP: Using baseURL from environment/default: https://openrouter.ai/api/v1
✅ Evently SGR MCP: API Key present: true
```

### Частые проблемы

#### 1. "LLM API key not found"

**Симптом:** Warning в логах при инициализации
```
⚠️ Evently SGR MCP: LLM API key not found. SGR tools will fail until key is provided.
```

**Решение:** 
- Добавьте Chat Model с credential в агенте
- Или установите `LLM_API_KEY` env var

#### 2. "API key is required for SGR Decision Engine"

**Симптом:** Ошибка при попытке использовать SGR tool

**Решение:** См. пункт 1

#### 3. "Evently API credential is required"

**Симптом:** Ошибка при инициализации ноды

**Решение:** Выберите Evently API (Keycloak) credential в настройках ноды

## Сравнение с другими Evently MCP нодами

| Нода | Требует LLM API | Интеллектуальный анализ | Use Case |
|------|-----------------|-------------------------|----------|
| Evently SGR | ✅ Да | ✅ Да | Сложные запросы, требующие анализа |
| Evently Enumerations | ❌ Нет | ❌ Нет | Прямая работа с enumerations API |
| Evently Attributes | ❌ Нет | ❌ Нет | Прямая работа с attributes API |
| Evently Objects | ❌ Нет | ❌ Нет | Прямая работа с objects API |

**Когда использовать SGR:**
- Пользователь задает вопросы на естественном языке
- Нужен интеллектуальный анализ намерений
- Требуется автоматический выбор правильного endpoint

**Когда использовать обычные ноды:**
- Четко известен нужный API endpoint
- Не нужен анализ LLM
- Хотите минимизировать зависимости

## Безопасность

- ✅ API keys передаются через secure credentials в Flowise
- ✅ Credentials шифруются в Flowise database
- ✅ API keys не логируются в plaintext (только `!!apiKey`)
- ✅ Environment variables поддерживаются для CI/CD

## Дополнительная информация

- См. `INITIALIZATION_FIX.md` для технических деталей реализации
- См. логи сервера для troubleshooting
- Проверьте Evently API документацию для деталей по endpoints

