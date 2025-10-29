## Credentials: Evently API (JWT) — Продакшен

Только продакшен‑подход с Service Account (OAuth2 Client Credentials) в Keycloak.

### 1) Что уже есть
Realm `evently` импортируется автоматически из `.files/evently-realm-export.json` при старте Keycloak.
В нем присутствует конфиденциальный клиент с Service Account:
- `clientId`: `evently-confidential-client`
- `serviceAccountsEnabled`: true

### 2) Получение сервисного access_token
В продакшене токен получает машина, а не пользователь. Запрос:
```bash
curl -X POST http://localhost:18080/realms/evently/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=evently-confidential-client" \
  -d "client_secret=<SECRET_ИЗ_REALM>"
```
Ответ содержит `access_token` и `expires_in`.

Примечание: секрет клиента берётся из экспорта realm или из Keycloak Admin Console → Clients → `evently-confidential-client` → Credentials.

### 3) Прокинуть токен в контейнер Flowise
В `docker-compose.yml` для сервиса `evently.flowise` задайте переменные и перезапустите сервис:
```yaml
evently.flowise:
  environment:
    - EVENTLY_API_URL=http://evently.api:8080
    - EVENTLY_API_TOKEN=<SERVICE_ACCOUNT_ACCESS_TOKEN>
```
Перезапуск:
```bash
docker-compose up -d --no-deps --force-recreate evently.flowise
```

В Flowise UI при создании Credential "Evently API" поля будут предзаполнены.

### 4) Автоматическая ротация токена (рекомендуется)
Сервисный токен истекает, поэтому настройте автообновление по расписанию:
- Периодически вызывать `client_credentials` и обновлять `EVENTLY_API_TOKEN` через секреты/переменные окружения
- Без простоя: хранить токен во внешнем секрет‑хранилище (Vault/SM) и считывать его сервером Flowise

Пример и подробности: `flowise-fork/scripts/setup-service-account.md`

### 5) Проверка
- Выполните любой Evently tool в Flowise → не должно быть `401 Unauthorized`

### 6) Типичные ошибки
- 401 Unauthorized → некорректный/просроченный токен, неверные роли Service Account
- ECONNREFUSED/timeout → контейнер Evently API не поднят/нездоров

### Ссылки
- `flowise-fork/scripts/setup-service-account.md`
Realm `evently` импортируется автоматически из `.files/evently-realm-export.json`.
В нем уже есть конфиденциальный клиент с Service Account:
- `clientId`: `evently-confidential-client`
- `serviceAccountsEnabled`: true

Получение сервисного токена (локально):
```bash
curl -X POST http://localhost:18080/realms/evently/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=evently-confidential-client" \
  -d "client_secret=<SECRET_ИЗ_REALM>"
```

Затем прокиньте токен в Compose:
```yaml
evently.flowise:
  environment:
    - EVENTLY_API_URL=http://evently.api:8080
    - EVENTLY_API_TOKEN=<SERVICE_ACCOUNT_ACCESS_TOKEN>
```

Опционально: автоматическая ротация
- Создайте скрипт, который по `client_credentials` получает новый токен по расписанию и обновляет переменную/секрет.
- Пример и детали: `flowise-fork/scripts/setup-service-account.md`

---

### Проверка
- Выполните любой Evently tool в Flowise → не должно быть `401 Unauthorized`.

### Типичные ошибки
- 401 Unauthorized → токен истек/неверный → получите новый токен (или используйте Service Account)
- ECONNREFUSED/timeout → контейнер Evently API не поднят/нездоров

### Ссылки
- `flowise-fork/scripts/setup-service-account.md`
- ag-ui_docs/EVENTLY_INTEGRATION_README.md
- ag-ui_docs/EVENTLY_TOOLS_QUICKSTART.md
- [Detailed Authentication Flow](./AUTHENTICATION_FLOW.md)