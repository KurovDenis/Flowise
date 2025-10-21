## Docker Commands & Health Checks

### 🚀 Запуск Flowise с кастомными нодами Evently

**Основной способ (рекомендуется)**
```bash
cd C:\evently2\evently
docker-compose up -d evently.flowise
```

**Пересборка с изменениями кода**
```bash
cd C:\evently2\evently
docker-compose build --no-cache evently.flowise
docker-compose up -d evently.flowise
```

**Полная пересборка (если проблемы)**
```bash
cd C:\evently2\evently
docker-compose stop evently.flowise
docker-compose build --no-cache evently.flowise
docker-compose up -d evently.flowise
```

### 📊 Мониторинг и логи

**Проверка статуса**
```bash
docker-compose ps evently.flowise
docker ps | findstr flowise
```

**Просмотр логов**
```bash
docker-compose logs evently.flowise --tail 20
docker-compose logs evently.flowise -f
```

**Остановка/перезапуск**
```bash
docker-compose stop evently.flowise
docker-compose restart evently.flowise
```

### 🔍 Health Checks

**Flowise API**
```bash
curl http://localhost:3005/api/v1/ping
# PowerShell: Invoke-WebRequest -Uri "http://localhost:3005/api/v1/ping" -Method GET
```

**Evently API**
```bash
curl http://localhost:8080/api/attributevalue/attributes
```

**Проверка кастомных нодов в контейнере**
```bash
docker exec Evently.Flowise ls -la /usr/src/packages/components/nodes/tools/ | findstr -i evently
docker exec Evently.Flowise ls -la /usr/src/packages/components/credentials/ | findstr -i evently
```

### 🎯 Доступ к Flowise

- **URL**: http://localhost:3005
- **Логин**: admin
- **Пароль**: password123
- **Кастомные ноды**: Tools → EventlyCreateAttribute, EventlyCreateAttributeType, EventlySelectAttributeType

### ✅ Решенные проблемы (2025-10-21)

**Проблема**: Кастомные ноды Evently не отображались в Flowise UI
**Причина**: Использовался готовый образ `flowiseai/flowise:latest`, который не может загружать новые ноды
**Решение**: 
- Переписан Dockerfile для сборки из исходников
- Использован `node:20-alpine` вместо готового образа
- Добавлена установка зависимостей для api-documentation
- Кастомные ноды теперь встроены в образ при сборке

**Новый Dockerfile подход**:
```dockerfile
FROM node:20-alpine
# Установка зависимостей
RUN apk add --update libc6-compat python3 make g++ curl chromium
# Копирование и сборка исходников
COPY . .
RUN pnpm install
RUN cd packages/api-documentation && pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
```

See also
- ag-ui_docs/DOCKER_DEPLOYMENT_GUIDE.md

