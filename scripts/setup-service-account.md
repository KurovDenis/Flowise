# Service Account для Flowise (Продакшен подход)

## 1. Создание Service Account в Keycloak

### В Keycloak Admin Console:
1. Откройте http://localhost:18080
2. Логин: admin/admin
3. Realm: evently
4. Clients → Create
5. Client ID: `flowise-service`
6. Client Protocol: `openid-connect`
7. Access Type: `confidential`
8. Service Accounts Enabled: `ON`
9. Authorization Enabled: `OFF`
10. Save

### Настройка Client Credentials:
1. В созданном клиенте → Credentials
2. Скопируйте `Secret`
3. В Settings → Access Type: `confidential`

### Настройка ролей:
1. Service Account Roles → Assign Role
2. Выберите нужные роли (например, `admin` или создайте `flowise-service` роль)

## 2. Получение токена

```bash
# Получить токен через Client Credentials
curl -X POST http://localhost:18080/realms/evently/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=flowise-service" \
  -d "client_secret=YOUR_SECRET_HERE"
```

## 3. Настройка в docker-compose.yml

```yaml
evently.flowise:
  environment:
    - EVENTLY_API_URL=http://evently.api:8080
    - EVENTLY_API_TOKEN=YOUR_SERVICE_ACCOUNT_TOKEN
    - FLOWISE_SERVICE_ACCOUNT_CLIENT_ID=flowise-service
    - FLOWISE_SERVICE_ACCOUNT_CLIENT_SECRET=YOUR_SECRET_HERE
```

## 4. Автоматическое обновление токена

Создайте скрипт для автоматического обновления токена:

```javascript
// scripts/refresh-token.js
const axios = require('axios');

async function refreshToken() {
  const response = await axios.post('http://evently.identity:8080/realms/evently/protocol/openid-connect/token', {
    grant_type: 'client_credentials',
    client_id: process.env.FLOWISE_SERVICE_ACCOUNT_CLIENT_ID,
    client_secret: process.env.FLOWISE_SERVICE_ACCOUNT_CLIENT_SECRET
  }, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  
  return response.data.access_token;
}
```

## 5. Преимущества Service Account

- ✅ Токены не истекают (или обновляются автоматически)
- ✅ Отдельные права для сервисов
- ✅ Безопаснее пользовательских JWT
- ✅ Стандартный OAuth2 подход
- ✅ Легко ротировать секреты
