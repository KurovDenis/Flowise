# Changelog - Evently SGR MCP

## [Fix] - 2025-11-17

### 🐛 Исправлена проблема инициализации с LLM API Key

#### Что было исправлено

**Проблема:**
- Нода требовала LLM API key при инициализации (`getTools()`)
- Падала с ошибкой если API key не был найден в `options.chatModel`
- Это происходило потому что Flowise еще не загружает credentials на момент инициализации
- Отличалось от поведения других MCP нод (Enumerations, Attributes)

**Решение:**
- Убрана обязательная проверка API key при инициализации
- API key теперь опциональный на этапе `getTools()`
- Проверка API key перенесена на этап фактического использования (в `EventlySGRServer.getSgrEngine()`)
- Добавлены warning сообщения вместо ошибок при отсутствии API key

#### Измененные файлы

**EventlySGRMCP.ts:**
```diff
- if (!apiKey) {
-     throw new Error('LLM API key is required...')
- }
+ // Note: API key is optional at initialization time
+ // It will be checked when SGR tools are actually used
+ if (!apiKey) {
+     console.log('⚠️  Evently SGR MCP: LLM API key not found. SGR tools will fail until key is provided.')
+ }
+ console.log('Evently SGR MCP: API Key present:', !!apiKey)
```

#### Добавленная документация

- `INITIALIZATION_FIX.md` - подробное техническое описание проблемы и решения
- `USAGE.md` - инструкция по использованию для пользователей
- `CHANGELOG.md` - этот файл

#### Поведение после исправления

**✅ Инициализация без LLM API key:**
```
Evently SGR MCP: Available options keys: [...]
⚠️  Evently SGR MCP: LLM API key not found. SGR tools will fail until key is provided.
Evently SGR MCP: API Key present: false
✅ Evently SGR MCP: Initialized with N tools
```

**✅ Использование без LLM API key:**
```
Error: API key is required for SGR Decision Engine. 
Please configure it in the agent node (chat model credential) 
or set LLM_API_KEY environment variable.
```

**✅ Использование с LLM API key:**
```
Evently SGR MCP: Got API key from chatModel
Evently SGR MCP: API Key present: true
✅ Evently SGR MCP: Initialized with N tools
[SGR Decision Engine работает корректно]
```

#### Совместимость

- ✅ Обратная совместимость сохранена
- ✅ Существующие агенты с настроенным Chat Model продолжат работать
- ✅ Новые агенты могут быть созданы и настроены без ошибок инициализации
- ✅ Environment variables (`LLM_API_KEY`) продолжают работать

#### Тестирование

Проверены сценарии:
1. ✅ Инициализация без LLM API key - работает
2. ✅ Инициализация с LLM API key через chatModel - работает
3. ✅ Инициализация с LLM API key через env var - работает
4. ✅ Попытка использования без API key - понятная ошибка
5. ✅ Использование с API key - все работает

#### Breaking Changes

Нет breaking changes. Все изменения полностью обратно совместимы.

#### Migration Guide

Миграция не требуется. Все существующие настройки продолжат работать.

Если вы получаете warning при инициализации:
```
⚠️  Evently SGR MCP: LLM API key not found
```

**Варианты решения:**

**Вариант 1: Chat Model (рекомендуется)**
1. Добавьте Chat Model в агента (например, ChatOpenRouter)
2. Настройте credential с API key
3. Evently SGR автоматически подхватит API key из Chat Model

**Вариант 2: Environment Variable**
```bash
export LLM_API_KEY=your-api-key
export LLM_MODEL=openai/gpt-4o-mini  # optional
export LLM_BASE_URL=https://openrouter.ai/api/v1  # optional
```

#### Related Issues

- Соответствует паттерну других MCP нод (Enumerations, Attributes, Objects)
- Улучшает UX - пользователи могут настроить ноду без немедленного предоставления LLM API key
- Сообщения об ошибках стали более понятными

