# Evently MCP: Аутентификация и Авторизация

## 📋 Содержание

1. [Проблема](#проблема)
2. [Текущая архитектура](#текущая-архитектура)
3. [Реализованное решение](#реализованное-решение)
4. [Нерешенная проблема: Авторизация Service Accounts](#нерешенная-проблема-авторизация-service-accounts)
5. [Предлагаемые решения](#предлагаемые-решения)
6. [Roadmap внедрения](#roadmap-внедрения)

---

## Проблема

### Исходная ситуация

При попытке вызвать `get_attributes` через Evently MCP Server возникала ошибка:

```
Error: API Error 500: Unknown error
```

### Root Cause Analysis

#### Проблема 1: Конфликт Axios Interceptors ✅ РЕШЕНО

**Файл:** `flowise-fork/packages/components/nodes/tools/MCP/Evently/core/EventlyApiClient.ts`

**Ошибка:**
```
Error: Cannot read properties of undefined (reading '__retryCount')
```

**Причина:**
Два response interceptor-а конфликтовали:
1. `setupInterceptors()` - нормализовал ошибки, но терял `error.config`
2. `setupRetryPolicy()` - пытался использовать `error.config.__retryCount`

**Решение:**
Объединили логику в один interceptor в `setupRetryPolicy()`:

```typescript
private setupRetryPolicy(): void {
    this.axiosInstance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const config = error.config as any

            // Initialize retry count if config exists
            if (config) {
                config.__retryCount = config.__retryCount || 0
            }

            // Retry logic...
            if (shouldRetry && config && config.__retryCount < maxRetries) {
                config.__retryCount++
                const delay = Math.pow(2, config.__retryCount - 1) * 1000
                await new Promise((resolve) => setTimeout(resolve, delay))
                return this.axiosInstance(config)
            }

            // Error normalization (merged from setupInterceptors)
            let errorMessage: string
            if (error.response) {
                const { status, data } = error.response
                const responseData = data as any
                errorMessage = `API Error ${status}: ${responseData?.detail || responseData?.message || 'Unknown error'}`
            } else if (error.request) {
                errorMessage = 'Network error: Unable to reach Evently API'
            } else {
                errorMessage = `Request error: ${error.message || 'Unknown error'}`
            }

            return Promise.reject(new Error(errorMessage))
        }
    )
}
```

---

#### Проблема 2: Истечение JWT токенов ✅ РЕШЕНО

**Проблема:**
- JWT токены передавались как env переменные (`EVENTLY_JWT_TOKEN`)
- Токены истекали через 5-30 минут
- Требовалась ручная ротация токенов

**Решение: Client Credentials Flow с автоматическим обновлением**

**Реализация:**

1. **KeycloakTokenProvider** - управление токенами:

```typescript
export class KeycloakTokenProvider {
    private currentToken?: TokenData

    async getToken(): Promise<string> {
        // No token yet → request new
        if (!this.currentToken) {
            await this.requestNewToken()
            return this.currentToken!.accessToken
        }

        // Token expires soon (< 5 min) → refresh
        const now = Date.now()
        const bufferTime = 5 * 60 * 1000
        if (now >= this.currentToken.expiresAt - bufferTime) {
            await this.refreshToken()
        }

        return this.currentToken.accessToken
    }

    private async requestNewToken(): Promise<void> {
        const response = await axios.post(
            this.config.tokenUrl,
            new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.config.clientId,
                client_secret: this.config.clientSecret
            })
        )

        this.currentToken = {
            accessToken: response.data.access_token,
            refreshToken: response.data.refresh_token,
            expiresAt: Date.now() + response.data.expires_in * 1000
        }
    }
}
```

2. **Обновленный AuthManager**:

```typescript
export class AuthManager {
    private tokenProvider: KeycloakTokenProvider

    constructor(config: TokenProviderConfig) {
        this.tokenProvider = new KeycloakTokenProvider(config)
    }

    async getToken(): Promise<string> {
        return await this.tokenProvider.getToken()
    }
}
```

3. **docker-compose.yml** - передаем credentials вместо токенов:

```yaml
evently.flowise:
  environment:
    # ❌ Больше НЕ нужно: EVENTLY_JWT_TOKEN
    
    # ✅ Используем Keycloak credentials
    - KEYCLOAK_TOKEN_URL=http://evently.identity:18080/realms/evently/protocol/openid-connect/token
    - KEYCLOAK_CLIENT_ID=evently-confidential-client
    - KEYCLOAK_CLIENT_SECRET=PzotcrvZRF9BHCKcUxdKfHWlIPECG49k
    - EVENTLY_API_URL=http://evently.api:8080
```

**Результат:**
✅ Токены обновляются автоматически каждые 5 минут
✅ Zero-downtime - нет необходимости перезапускать контейнеры
✅ Self-healing - система сама восстанавливается

---

#### Проблема 3: Авторизация Service Accounts ❌ НЕ РЕШЕНО

**Проблема:**
После исправления токенов, ошибка `500: Unknown error` сохранилась.

**Root Cause:**
```csharp
// src/Common/Evently.Common.Infrastructure/Authorization/CustomClaimsTransformation.cs
public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
{
    // ...
    Result<PermissionsResponse> result = await permissionService.GetUserPermissionsAsync(identityId);

    if (result.IsFailure)
    {
        throw new EventlyException(nameof(IPermissionService.GetUserPermissionsAsync), result.Error); // ← Здесь падает!
    }
    // ...
}
```

**Почему падает:**

1. MCP Server использует **Client Credentials Flow**
2. Получает токен с `sub = e6fc0a9a-c466-43b7-93df-ff40eb3c0540` (service account)
3. `CustomClaimsTransformation` пытается получить permissions через `GetUserPermissionsAsync(identityId)`
4. Запрос к БД:

```sql
-- src/Modules/Users/Evently.Modules.Users.Application/Users/GetUserPermissions/GetUserPermissionsQueryHandler.cs
SELECT DISTINCT r.permissions
FROM users.users u
INNER JOIN users.user_roles ur ON ur.user_id = u.id
INNER JOIN users.roles r ON r.id = ur.role_id
WHERE u.identity_id = @IdentityId  -- ← Пользователя с таким identity_id НЕТ!
```

5. Результат: пустой набор → `result.IsFailure = true` → Exception

**Текущий статус:**
```
Subject (sub): e6fc0a9a-c466-43b7-93df-ff40eb3c0540
Client ID: evently-confidential-client
Preferred Username: service-account-evently-confidential-client
```

❌ Пользователя с `identity_id = e6fc0a9a-c466-43b7-93df-ff40eb3c0540` НЕТ в таблице `users.users`

---

## Текущая архитектура

### Поток аутентификации и авторизации

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Flowise Container                                        │
│    Env vars:                                                 │
│    - KEYCLOAK_CLIENT_ID=evently-confidential-client         │
│    - KEYCLOAK_CLIENT_SECRET=PzotcrvZRF9BHC...               │
│    - KEYCLOAK_TOKEN_URL=http://...                          │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MCP Server (server.ts)                                   │
│    - AuthManager(config) ← Keycloak credentials             │
│    - KeycloakTokenProvider.getToken()                       │
│      • Проверяет срок действия                              │
│      • Обновляет при необходимости                          │
│      • Возвращает валидный access_token                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Keycloak (Client Credentials Flow)                       │
│    POST /realms/evently/protocol/openid-connect/token       │
│    Response:                                                 │
│    {                                                         │
│      "access_token": "eyJhbG...",                            │
│      "token_type": "Bearer",                                 │
│      "expires_in": 300                                       │
│    }                                                         │
│                                                              │
│    Token payload:                                            │
│    {                                                         │
│      "sub": "e6fc0a9a-c466-43b7-93df-ff40eb3c0540",         │
│      "preferred_username": "service-account-evently-...",   │
│      "azp": "evently-confidential-client"                   │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. API Request                                              │
│    GET http://evently.api:8080/api/attributes               │
│    Headers:                                                  │
│      Authorization: Bearer eyJhbG...                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Evently API - Authentication Middleware                  │
│    - Validates JWT signature ✅                             │
│    - Checks token expiration ✅                             │
│    - Extracts claims → ClaimsPrincipal                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CustomClaimsTransformation.TransformAsync()              │
│    - Извлекает identity_id из токена                        │
│    - Вызывает IPermissionService.GetUserPermissionsAsync()  │
│      ↓                                                       │
│      GetUserPermissionsQuery → Handler                      │
│      ↓                                                       │
│      SQL: SELECT ... FROM users WHERE identity_id = ...     │
│      ↓                                                       │
│      ❌ ПОЛЬЗОВАТЕЛЬ НЕ НАЙДЕН                              │
│      ↓                                                       │
│      Result.IsFailure = true                                │
│      ↓                                                       │
│      throw EventlyException ← 500 Internal Server Error     │
└─────────────────────────────────────────────────────────────┘
```

---

## Реализованное решение

### ✅ Что уже работает

#### 1. Автоматическое обновление токенов

**Файлы:**
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/core/KeycloakTokenProvider.ts`
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/core/AuthManager.ts`
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/server.ts`

**Особенности:**
- Токены запрашиваются автоматически при старте MCP Server
- Обновляются за 5 минут до истечения (proactive refresh)
- Fallback на `requestNewToken()` если refresh не удался
- Retry policy с exponential backoff

**Преимущества:**
✅ Zero manual intervention
✅ Zero downtime
✅ Production-ready
✅ Self-healing

#### 2. Credential в Flowise

**Файлы:**
- `flowise-fork/packages/components/credentials/EventlyKeycloakApi.credential.ts`
- `flowise-fork/packages/server/src/database/migrations/postgres/1760000000000-MigrateToKeycloakCredential.ts`

**Автоматическое создание credential:**

При старте Flowise автоматически создается credential `Evently API - Default` если:
- Установлена переменная `KEYCLOAK_CLIENT_ID`
- Установлена переменная `KEYCLOAK_CLIENT_SECRET`
- Установлена переменная `KEYCLOAK_TOKEN_URL` (опционально)
- Установлена переменная `EVENTLY_API_URL` (опционально)

**Логика credential:**
```typescript
{
  "apiUrl": "http://evently.api:8080",
  "keycloakTokenUrl": "http://evently.identity:18080/realms/evently/protocol/openid-connect/token",
  "keycloakClientId": "evently-confidential-client",
  "keycloakClientSecret": "PzotcrvZRF9BHCKcUxdKfHWlIPECG49k"
}
```

**Шифрование:**
- Credentials шифруются AES перед сохранением в БД
- Расшифровываются при использовании в MCP узле

#### 3. Resilience Patterns в EventlyApiClient

**Реализовано:**
- ✅ **Rate Limiting** - не более 10 запросов в секунду
- ✅ **Circuit Breaker** - защита от каскадных сбоев
- ✅ **Retry Policy** - 3 попытки с exponential backoff (1s, 2s, 4s)
- ✅ **Error Normalization** - унифицированные сообщения об ошибках

---

## Нерешенная проблема: Авторизация Service Accounts

### Суть проблемы

**Service Account (Client Credentials Flow) НЕ является пользователем системы:**

```
Service Account:
  ├─ Keycloak ID: e6fc0a9a-c466-43b7-93df-ff40eb3c0540
  ├─ Preferred Username: service-account-evently-confidential-client
  ├─ Тип: Machine-to-Machine (M2M)
  └─ НЕТ записи в users.users ❌

Regular User:
  ├─ Keycloak ID: 0a373fd9-284f-43d3-88f4-6c9dd5c1b5d8
  ├─ Email: admin@test.com
  ├─ Тип: Human user
  └─ ЕСТЬ запись в users.users ✅
```

### Текущая логика авторизации

**Evently API ожидает:**
1. Каждый аутентифицированный пользователь **ДОЛЖЕН** существовать в `users.users`
2. Permissions загружаются из БД через `GetUserPermissionsAsync(identityId)`
3. Если пользователя нет → Exception

**Проблема:**
Service accounts (M2M) не имеют записи в `users.users` → Authorization падает

---

## Предлагаемые решения

### Вариант 1: Быстрый Hotfix - Автоматические права для Service Accounts ⚡

**Идея:** Service accounts получают все права автоматически без проверки БД.

**Изменения в `CustomClaimsTransformation.cs`:**

```csharp
public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
{
    if (principal.HasClaim(c => c.Type == CustomClaims.Permission))
    {
        return principal;
    }

    using IServiceScope scope = serviceScopeFactory.CreateScope();
    IPermissionService permissionService = scope.ServiceProvider.GetRequiredService<IPermissionService>();

    string identityId = principal.GetIdentityId();
    Result<PermissionsResponse> result = await permissionService.GetUserPermissionsAsync(identityId);

    if (result.IsFailure)
    {
        // 🔍 Check if this is a service account (Client Credentials Flow)
        string? preferredUsername = principal.FindFirst("preferred_username")?.Value;
        
        if (preferredUsername?.StartsWith("service-account-", StringComparison.OrdinalIgnoreCase) == true)
        {
            // ✅ Service accounts get full permissions automatically
            var serviceClaimsIdentity = new ClaimsIdentity();
            serviceClaimsIdentity.AddClaim(new Claim(CustomClaims.Sub, identityId));
            
            // Grant all permissions to service accounts
            string[] servicePermissions = new[]
            {
                "users:read",
                "users:manage",
                "events:read",
                "events:create",
                "events:update",
                "events:delete",
                "tickets:read",
                "tickets:create",
                "tickets:update",
                "tickets:delete",
                "attributes:read",
                "attributes:create",
                "attributes:update",
                "attributes:delete"
            };
            
            foreach (string permission in servicePermissions)
            {
                serviceClaimsIdentity.AddClaim(new Claim(CustomClaims.Permission, permission));
            }
            
            principal.AddIdentity(serviceClaimsIdentity);
            return principal;
        }
        
        // ❌ For regular users, throw exception if permissions cannot be loaded
        throw new EventlyException(nameof(IPermissionService.GetUserPermissionsAsync), result.Error);
    }

    // ✅ Regular user with permissions from database
    var claimsIdentity = new ClaimsIdentity();
    claimsIdentity.AddClaim(new Claim(CustomClaims.Sub, result.Value.UserId.ToString()));
    
    foreach (string permission in result.Value.Permissions)
    {
        claimsIdentity.AddClaim(new Claim(CustomClaims.Permission, permission));
    }
    
    principal.AddIdentity(claimsIdentity);
    return principal;
}
```

**Плюсы:**
- ✅ Простая реализация (5 минут)
- ✅ Решает проблему сразу
- ✅ Не требует изменений в БД

**Минусы:**
- ❌ Service accounts получают **ВСЕ** права
- ❌ Нет гибкости управления правами
- ❌ Небезопасно для production (если service account скомпрометирован)
- ❌ Hardcoded список permissions

**Когда использовать:**
- Development/Testing
- MVP
- Небольшие команды с доверенными сервисами

---

### Вариант 2: Service Accounts как Virtual Users 🎯 **РЕКОМЕНДУЕТСЯ**

**Идея:** Создавать "виртуальных" пользователей в БД для service accounts с гибким управлением правами.

#### Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│ users.users                                                 │
├─────────────────────────────────────────────────────────────┤
│ id (uuid)                                                   │
│ email                                                        │
│ first_name                                                   │
│ last_name                                                    │
│ identity_id (uuid) ← Keycloak service account ID            │
│ is_service_account (boolean) ← НОВОЕ ПОЛЕ                  │
│ created_at                                                   │
└─────────────────────────────────────────────────────────────┘
         ↓ (JOIN)
┌─────────────────────────────────────────────────────────────┐
│ users.user_roles                                            │
├─────────────────────────────────────────────────────────────┤
│ user_id → users.users.id                                    │
│ role_id → users.roles.id                                    │
└─────────────────────────────────────────────────────────────┘
         ↓ (JOIN)
┌─────────────────────────────────────────────────────────────┐
│ users.roles                                                 │
├─────────────────────────────────────────────────────────────┤
│ id                                                           │
│ name (e.g., "mcp-agent-attributes-readonly")                │
│ permissions (JSON array)                                     │
└─────────────────────────────────────────────────────────────┘
```

#### Реализация

**Шаг 1: Миграция БД - добавить поле `is_service_account`**

```sql
-- Миграция: AddIsServiceAccountColumn
ALTER TABLE users.users 
ADD COLUMN is_service_account BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_users_is_service_account ON users.users(is_service_account);
```

**Шаг 2: Создать специализированные роли для агентов**

```sql
-- Роль для агентов работающих только с атрибутами
INSERT INTO users.roles (id, name, permissions) 
VALUES (
    'a1b2c3d4-...',
    'mcp-agent-attributes-readonly',
    '["attributes:read"]'::jsonb
);

-- Роль для агентов работающих с событиями
INSERT INTO users.roles (id, name, permissions) 
VALUES (
    'a1b2c3d5-...',
    'mcp-agent-events-manager',
    '["events:read", "events:create", "events:update"]'::jsonb
);

-- Роль для полного доступа
INSERT INTO users.roles (id, name, permissions) 
VALUES (
    'a1b2c3d6-...',
    'mcp-agent-admin',
    '["users:read", "users:manage", "events:read", "events:create", "events:update", "events:delete", "tickets:read", "tickets:create", "tickets:update", "tickets:delete", "attributes:read", "attributes:create", "attributes:update", "attributes:delete"]'::jsonb
);
```

**Шаг 3: Скрипт создания service account пользователя**

```powershell
# scripts/create-service-account-user.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceAccountIdentityId,  # Keycloak service account ID
    
    [Parameter(Mandatory=$true)]
    [string]$ServiceAccountName,        # e.g., "MCP Agent - Attributes"
    
    [Parameter(Mandatory=$true)]
    [string]$RoleName                   # e.g., "mcp-agent-attributes-readonly"
)

# 1. Создать пользователя в БД
$userId = [guid]::NewGuid()

docker exec -i Evently.Database psql -U postgres -d evently -c @"
INSERT INTO users.users (id, email, first_name, last_name, identity_id, is_service_account, created_at)
VALUES (
    '$userId',
    'service-account-$ServiceAccountName@evently.internal',
    'MCP Agent',
    '$ServiceAccountName',
    '$ServiceAccountIdentityId',
    TRUE,
    NOW()
)
ON CONFLICT (identity_id) DO UPDATE 
SET email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_service_account = EXCLUDED.is_service_account
RETURNING id, email, identity_id;
"@

# 2. Получить role_id по имени
$roleId = docker exec -i Evently.Database psql -U postgres -d evently -t -c @"
SELECT id FROM users.roles WHERE name = '$RoleName';
"@ | ForEach-Object { $_.Trim() }

if (-not $roleId) {
    Write-Error "Role '$RoleName' not found!"
    exit 1
}

# 3. Назначить роль
docker exec -i Evently.Database psql -U postgres -d evently -c @"
INSERT INTO users.user_roles (user_id, role_id)
VALUES ('$userId', '$roleId')
ON CONFLICT DO NOTHING;
"@

# 4. Проверить permissions
Write-Host "✅ Service account user created and assigned role '$RoleName'"
Write-Host ""
Write-Host "Verifying permissions:"

docker exec -i Evently.Database psql -U postgres -d evently -c @"
SELECT 
    u.email,
    u.identity_id,
    u.is_service_account,
    r.name as role_name,
    r.permissions
FROM users.users u
INNER JOIN users.user_roles ur ON ur.user_id = u.id
INNER JOIN users.roles r ON r.id = ur.role_id
WHERE u.identity_id = '$ServiceAccountIdentityId';
"@
```

**Шаг 4: Использование**

```bash
# 1. Получить identity_id service account из токена
$tokenResponse = Invoke-RestMethod -Uri "http://localhost:18080/realms/evently/protocol/openid-connect/token" `
  -Method POST `
  -Body "grant_type=client_credentials&client_id=evently-confidential-client&client_secret=PzotcrvZRF9BHCKcUxdKfHWlIPECG49k" `
  -ContentType "application/x-www-form-urlencoded"

$payload = $tokenResponse.access_token.Split('.')[1]
$payload = $payload.PadRight([math]::Ceiling($payload.Length / 4) * 4, '=')
$decoded = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload)) | ConvertFrom-Json
$serviceAccountId = $decoded.sub

# 2. Создать service account пользователя с нужными правами
.\scripts\create-service-account-user.ps1 `
  -ServiceAccountIdentityId $serviceAccountId `
  -ServiceAccountName "Attributes Manager" `
  -RoleName "mcp-agent-attributes-readonly"
```

**Плюсы:**
- ✅ Гибкое управление правами на уровне БД
- ✅ Можно создавать агентов с разными правами
- ✅ Стандартный механизм авторизации (используется существующая логика)
- ✅ Audit trail - видно кто и когда делал запросы
- ✅ Легко добавлять/удалять права через UPDATE roles

**Минусы:**
- ⚠️ Требует миграции БД
- ⚠️ Требует скрипта для создания service account users
- ⚠️ Нужно синхронизировать Keycloak service accounts с БД

**Когда использовать:**
- ✅ Production
- ✅ Когда нужен контроль прав для разных агентов
- ✅ Когда важен audit trail

---

### Вариант 3: Keycloak Roles Mapping 🔐 **Enterprise-grade**

**Идея:** Использовать роли из Keycloak напрямую, без дублирования в БД.

#### Архитектура

```
┌─────────────────────────────────────────────────────────────┐
│ Keycloak Service Account                                    │
├─────────────────────────────────────────────────────────────┤
│ Client: evently-confidential-client                         │
│ Service Account Roles:                                       │
│   ├─ evently-attributes-manager                             │
│   ├─ evently-events-readonly                                │
│   └─ evently-admin                                          │
└─────────────────────────────────────────────────────────────┘
                   ↓ (включаются в JWT token)
┌─────────────────────────────────────────────────────────────┐
│ JWT Token (claims)                                          │
├─────────────────────────────────────────────────────────────┤
│ {                                                            │
│   "sub": "e6fc0a9a-c466-43b7-93df-ff40eb3c0540",            │
│   "resource_access": {                                       │
│     "evently-confidential-client": {                         │
│       "roles": [                                             │
│         "evently-attributes-manager"                         │
│       ]                                                      │
│     }                                                        │
│   }                                                          │
│ }                                                            │
└─────────────────────────────────────────────────────────────┘
                   ↓ (мапинг в CustomClaimsTransformation)
┌─────────────────────────────────────────────────────────────┐
│ Evently Permissions                                         │
├─────────────────────────────────────────────────────────────┤
│ evently-attributes-manager →                                │
│   ["attributes:read", "attributes:create",                  │
│    "attributes:update", "attributes:delete"]                │
└─────────────────────────────────────────────────────────────┘
```

#### Реализация

**Шаг 1: Создать роли в Keycloak**

```bash
# 1. Создать client roles для evently-confidential-client
kcadm.sh create clients/{client-id}/roles -r evently -s name=evently-attributes-manager
kcadm.sh create clients/{client-id}/roles -r evently -s name=evently-events-readonly
kcadm.sh create clients/{client-id}/roles -r evently -s name=evently-admin

# 2. Назначить роль service account
kcadm.sh add-roles -r evently \
  --uusername service-account-evently-confidential-client \
  --cclientid evently-confidential-client \
  --rolename evently-attributes-manager
```

**Шаг 2: Настроить Client Scope в Keycloak**

```json
// Mapper: "client-roles-mapper"
{
  "protocol": "openid-connect",
  "protocolMapper": "oidc-usermodel-client-role-mapper",
  "config": {
    "claim.name": "resource_access.${client_id}.roles",
    "jsonType.label": "String",
    "multivalued": "true"
  }
}
```

**Шаг 3: Мапинг ролей в `CustomClaimsTransformation.cs`**

```csharp
// src/Common/Evently.Common.Infrastructure/Authorization/ServiceAccountRoleMapper.cs
public static class ServiceAccountRoleMapper
{
    private static readonly Dictionary<string, string[]> RolePermissionsMap = new()
    {
        ["evently-admin"] = new[]
        {
            "users:read", "users:manage",
            "events:read", "events:create", "events:update", "events:delete",
            "tickets:read", "tickets:create", "tickets:update", "tickets:delete",
            "attributes:read", "attributes:create", "attributes:update", "attributes:delete"
        },
        ["evently-attributes-manager"] = new[]
        {
            "attributes:read", "attributes:create", "attributes:update", "attributes:delete"
        },
        ["evently-events-readonly"] = new[]
        {
            "events:read"
        },
        ["evently-events-manager"] = new[]
        {
            "events:read", "events:create", "events:update", "events:delete"
        }
    };

    public static string[] GetPermissionsForRoles(IEnumerable<string> roles)
    {
        return roles
            .SelectMany(role => RolePermissionsMap.TryGetValue(role, out var permissions) 
                ? permissions 
                : Array.Empty<string>())
            .Distinct()
            .ToArray();
    }
}
```

```csharp
// src/Common/Evently.Common.Infrastructure/Authorization/CustomClaimsTransformation.cs
public async Task<ClaimsPrincipal> TransformAsync(ClaimsPrincipal principal)
{
    if (principal.HasClaim(c => c.Type == CustomClaims.Permission))
    {
        return principal;
    }

    using IServiceScope scope = serviceScopeFactory.CreateScope();
    IPermissionService permissionService = scope.ServiceProvider.GetRequiredService<IPermissionService>();

    string identityId = principal.GetIdentityId();
    Result<PermissionsResponse> result = await permissionService.GetUserPermissionsAsync(identityId);

    if (result.IsFailure)
    {
        // Check if this is a service account
        string? preferredUsername = principal.FindFirst("preferred_username")?.Value;
        
        if (preferredUsername?.StartsWith("service-account-", StringComparison.OrdinalIgnoreCase) == true)
        {
            // Extract roles from JWT token
            var resourceAccessClaim = principal.FindFirst("resource_access")?.Value;
            if (resourceAccessClaim != null)
            {
                var resourceAccess = JsonSerializer.Deserialize<Dictionary<string, ClientRoles>>(resourceAccessClaim);
                var clientRoles = resourceAccess?["evently-confidential-client"]?.Roles ?? Array.Empty<string>();
                
                // Map Keycloak roles to permissions
                var permissions = ServiceAccountRoleMapper.GetPermissionsForRoles(clientRoles);
                
                var serviceClaimsIdentity = new ClaimsIdentity();
                serviceClaimsIdentity.AddClaim(new Claim(CustomClaims.Sub, identityId));
                
                foreach (string permission in permissions)
                {
                    serviceClaimsIdentity.AddClaim(new Claim(CustomClaims.Permission, permission));
                }
                
                principal.AddIdentity(serviceClaimsIdentity);
                return principal;
            }
        }
        
        throw new EventlyException(nameof(IPermissionService.GetUserPermissionsAsync), result.Error);
    }

    // Regular user
    var claimsIdentity = new ClaimsIdentity();
    claimsIdentity.AddClaim(new Claim(CustomClaims.Sub, result.Value.UserId.ToString()));
    
    foreach (string permission in result.Value.Permissions)
    {
        claimsIdentity.AddClaim(new Claim(CustomClaims.Permission, permission));
    }
    
    principal.AddIdentity(claimsIdentity);
    return principal;
}
```

**Плюсы:**
- ✅ Централизованное управление ролями в Keycloak
- ✅ Роли включаются в токен → меньше запросов к БД
- ✅ Единая точка управления (Keycloak Admin Console)
- ✅ Поддержка Role-Based Access Control (RBAC)
- ✅ Легко интегрируется с внешними системами

**Минусы:**
- ⚠️ Требует настройки Keycloak
- ⚠️ Мапинг ролей hardcoded в C# коде
- ⚠️ Сложнее debugging (нужно проверять токен + мапинг)

**Когда использовать:**
- ✅ Enterprise production
- ✅ Когда используется SSO через Keycloak
- ✅ Когда нужна интеграция с другими системами

---

## Сравнение решений

| Критерий | Вариант 1: Hotfix | Вариант 2: Virtual Users | Вариант 3: Keycloak Roles |
|----------|-------------------|-------------------------|--------------------------|
| **Сложность внедрения** | ⭐ Очень простая | ⭐⭐ Средняя | ⭐⭐⭐ Высокая |
| **Время внедрения** | 5 минут | 1-2 часа | 4-8 часов |
| **Гибкость управления правами** | ❌ Нет | ✅ Да (через БД) | ✅ Да (через Keycloak) |
| **Security** | ⚠️ Низкая | ✅ Высокая | ✅ Высокая |
| **Audit trail** | ❌ Нет | ✅ Да | ⚠️ Частично |
| **Масштабируемость** | ❌ Низкая | ✅ Высокая | ✅ Очень высокая |
| **Production-ready** | ❌ Нет (только dev/test) | ✅ Да | ✅ Да |
| **Требует миграцию БД** | ❌ Нет | ✅ Да | ❌ Нет |
| **Требует настройку Keycloak** | ❌ Нет | ❌ Нет | ✅ Да |
| **Централизация управления** | ❌ Hardcoded | ⚠️ БД | ✅ Keycloak |

---

## Roadmap внедрения

### Фаза 1: Quick Fix (MVP) - 1 день

**Цель:** Заставить MCP работать для development/testing

**Действия:**
1. ✅ Внедрить Вариант 1 (автоматические права для service accounts)
2. ✅ Протестировать вызовы через MCP
3. ✅ Задокументировать limitations

**Ограничения:**
- Только для dev/test окружения
- Service accounts имеют полные права

---

### Фаза 2: Production-Ready Authorization (Рекомендуется) - 3-5 дней

**Цель:** Гибкое управление правами для агентов

**Вариант 2A: Virtual Users (если предпочитаете управление через БД)**

**День 1: Миграция БД**
- [ ] Создать миграцию `AddIsServiceAccountColumn`
- [ ] Создать специализированные роли для агентов:
  - `mcp-agent-attributes-readonly`
  - `mcp-agent-events-manager`
  - `mcp-agent-admin`
- [ ] Протестировать миграцию на dev БД

**День 2: Скрипты**
- [ ] Создать `scripts/create-service-account-user.ps1`
- [ ] Создать `scripts/list-service-accounts.ps1`
- [ ] Создать `scripts/delete-service-account-user.ps1`
- [ ] Документация по использованию скриптов

**День 3: Тестирование**
- [ ] Создать тестового service account пользователя
- [ ] Протестировать разные роли:
  - Агент только с `attributes:read` → должен получать GET, но не POST
  - Агент с `events:create` → должен создавать события
- [ ] Проверить audit trail (кто делал запросы)

**День 4-5: Документация и внедрение**
- [ ] Создать `SERVICE_ACCOUNT_MANAGEMENT.md`
- [ ] Обновить `DEPLOYMENT.md`
- [ ] Применить в staging
- [ ] Code review
- [ ] Deploy в production

**Вариант 2B: Keycloak Roles (если предпочитаете централизацию в Keycloak)**

**День 1-2: Настройка Keycloak**
- [ ] Создать client roles в Keycloak
- [ ] Настроить Client Scope mappers
- [ ] Протестировать включение ролей в токены

**День 3: Backend изменения**
- [ ] Создать `ServiceAccountRoleMapper.cs`
- [ ] Обновить `CustomClaimsTransformation.cs`
- [ ] Unit тесты для мапинга ролей

**День 4-5: Тестирование и внедрение**
- [ ] Integration тесты
- [ ] Документация
- [ ] Deploy

---

### Фаза 3: Enterprise Features (опционально) - 2-4 недели

**Для крупных систем с множеством агентов:**

**Дополнительные фичи:**
- [ ] **Dynamic permissions loading** - загрузка мапинга из конфигурации (не hardcoded)
- [ ] **Permission caching** - кэширование permissions в Redis
- [ ] **Rate limiting per service account** - разные лимиты для разных агентов
- [ ] **Observability** - метрики использования по service accounts
- [ ] **Auto-provisioning** - автоматическое создание service account users при первом запросе
- [ ] **Permission audit logging** - детальные логи кто и какие права использовал

---

## Рекомендации

### Для Development/Testing (сейчас)

✅ **Используйте Вариант 1** - быстро решает проблему

```bash
# Просто примените изменения в CustomClaimsTransformation.cs
# Service accounts получат все права автоматически
```

---

### Для Production (в течение 1-2 недель)

✅ **Используйте Вариант 2** (Virtual Users) если:
- Вам удобнее управлять правами через SQL/БД
- Нужен простой audit trail (кто делал запросы)
- Не хотите усложнять настройку Keycloak

✅ **Используйте Вариант 3** (Keycloak Roles) если:
- У вас уже настроен Keycloak для SSO
- Хотите централизованное управление (Keycloak Admin Console)
- Планируете интеграцию с внешними системами
- Нужен enterprise-grade RBAC

---

## Связанные файлы

### Аутентификация (Client Credentials Flow)
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/core/KeycloakTokenProvider.ts`
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/core/AuthManager.ts`
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/server.ts`
- `flowise-fork/packages/components/credentials/EventlyKeycloakApi.credential.ts`

### API Client (Resilience Patterns)
- `flowise-fork/packages/components/nodes/tools/MCP/Evently/core/EventlyApiClient.ts`

### Авторизация (текущая проблема)
- `src/Common/Evently.Common.Infrastructure/Authorization/CustomClaimsTransformation.cs`
- `src/Modules/Users/Evently.Modules.Users.Application/Users/GetUserPermissions/GetUserPermissionsQueryHandler.cs`
- `src/Modules/Users/Evently.Modules.Users.Infrastructure/Authorization/PermissionService.cs`

### Scripts
- `scripts/create-admin-final.ps1` - создание обычного пользователя
- `scripts/create-service-account-user.ps1` - (TODO) создание service account пользователя

---

**Автор:** System Architect  
**Дата:** 2025-10-29  
**Версия:** 1.0  
**Статус:** В разработке (Проблема 3 не решена)


