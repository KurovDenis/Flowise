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

**Пересборка с entrypoint скриптом (рекомендуется)**
```bash
cd C:\evently2\evently
# Пересборка с новым entrypoint скриптом для автоматической инициализации БД
docker-compose build --no-cache evently.flowise
docker-compose up -d evently.flowise

# Проверка логов инициализации
docker logs Evently.Flowise | grep -E "(PostgreSQL|Database|Extensions)"
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

### 🗄️ Конфигурация базы данных (2025-01-21)

**Проблема**: Flowise использовал SQLite по умолчанию, что не подходит для продакшена
**Решение**: Настроена интеграция с PostgreSQL через entrypoint скрипт

**Конфигурация PostgreSQL**:
```yaml
environment:
  # База данных PostgreSQL
  - DATABASE_TYPE=postgres
  - DATABASE_HOST=evently.database
  - DATABASE_PORT=5432
  - DATABASE_USER=postgres
  - DATABASE_PASSWORD=postgres
  - DATABASE_NAME=flowise
  - DATABASE_SSL=false
```

**Автоматическое создание БД**:
- Entrypoint скрипт `flowise-fork/entrypoint.sh` создает базу `flowise` при каждом запуске контейнера
- Устанавливает необходимые расширения PostgreSQL (uuid-ossp, pg_trgm)
- Обрабатывает проблемы с collation версиями PostgreSQL
- Flowise автоматически создает свои таблицы при подключении
- Работает как для первого запуска, так и для перезапусков

**Проверка подключения к БД**:
```bash
# Проверка создания базы данных
docker exec Evently.Database psql -U postgres -c "\l" | findstr flowise

# Проверка таблиц Flowise
docker exec Evently.Database psql -U postgres -d flowise -c "\dt"

# Просмотр логов инициализации
docker logs Evently.Flowise | grep -E "(PostgreSQL|Database|Extensions)"
```

**Решение проблем с collation**:
```bash
# Если возникает ошибка "collation version mismatch"
docker exec Evently.Database psql -U postgres -c "ALTER DATABASE template1 REFRESH COLLATION VERSION; ALTER DATABASE postgres REFRESH COLLATION VERSION;"

# Создание базы данных вручную
docker exec Evently.Database psql -U postgres -c "CREATE DATABASE flowise;"
```

See also
- ag-ui_docs/DOCKER_DEPLOYMENT_GUIDE.md

