# 🗄️ Настройка базы данных Flowise

## 📋 Обзор изменений

Flowise теперь использует PostgreSQL вместо SQLite для лучшей производительности и надежности в продакшене.

## 🔧 Что было изменено

### 1. Конфигурация docker-compose.yml
- Добавлены переменные окружения для PostgreSQL
- Настроена зависимость от `evently.database`
- Удален volume `flowise_data` (больше не нужен)

### 2. Автоматическое создание БД
- Создан entrypoint скрипт `flowise-fork/entrypoint.sh`
- База данных `flowise` создается автоматически при каждом запуске контейнера
- Устанавливаются необходимые расширения PostgreSQL (uuid-ossp, pg_trgm)
- Обрабатывает проблемы с collation версиями PostgreSQL

### 3. Удобные скрипты
- Создан `rebuild-flowise.ps1` для управления Flowise
- Обновлена документация в `DOCKER_COMMANDS.md`

## 🚀 Как использовать

### Первый запуск
```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка создания базы данных
docker exec Evently.Database psql -U postgres -c "\l" | findstr flowise
```

### Пересборка Flowise
```bash
# Простая пересборка
.\rebuild-flowise.ps1

# Пересборка без кэша с логами
.\rebuild-flowise.ps1 -NoCache -Logs

# Принудительная пересборка
.\rebuild-flowise.ps1 -Force
```

### Проверка работы
```bash
# Health check
curl http://localhost:3005/api/v1/ping

# Проверка таблиц в БД
docker exec Evently.Database psql -U postgres -d flowise -c "\dt"

# Логи Flowise
docker-compose logs evently.flowise -f
```

## 🔍 Переменные окружения

| Переменная | Значение | Описание |
|------------|----------|----------|
| `DATABASE_TYPE` | `postgres` | Тип базы данных |
| `DATABASE_HOST` | `evently.database` | Хост PostgreSQL |
| `DATABASE_PORT` | `5432` | Порт PostgreSQL |
| `DATABASE_USER` | `postgres` | Пользователь БД |
| `DATABASE_PASSWORD` | `postgres` | Пароль БД |
| `DATABASE_NAME` | `flowise` | Имя базы данных |
| `DATABASE_SSL` | `false` | SSL соединение |

## 🎯 Преимущества

1. **Надежность**: PostgreSQL более стабилен чем SQLite
2. **Производительность**: Лучшая работа с большими объемами данных
3. **Масштабируемость**: Возможность репликации и кластеризации
4. **Интеграция**: Использует существующую инфраструктуру БД
5. **Резервное копирование**: Стандартные инструменты PostgreSQL

## ⚠️ Важные моменты

- База данных `flowise` создается автоматически при каждом запуске контейнера
- Flowise автоматически создает свои таблицы при подключении
- Все данные Flowise теперь хранятся в PostgreSQL
- Entrypoint скрипт обрабатывает проблемы с collation версиями PostgreSQL
- Резервное копирование: используйте стандартные инструменты PostgreSQL

## 🔧 Решение проблем

### Проблема с collation версиями PostgreSQL
Если возникает ошибка "collation version mismatch":
```bash
# Исправление вручную
docker exec Evently.Database psql -U postgres -c "ALTER DATABASE template1 REFRESH COLLATION VERSION; ALTER DATABASE postgres REFRESH COLLATION VERSION;"

# Создание базы данных вручную
docker exec Evently.Database psql -U postgres -c "CREATE DATABASE flowise;"
```

### Проверка работы entrypoint скрипта
```bash
# Просмотр логов инициализации
docker logs Evently.Flowise | grep -E "(PostgreSQL|Database|Extensions)"

# Проверка создания базы данных
docker exec Evently.Database psql -U postgres -c "\l" | findstr flowise
```

## 🔗 Связанные файлы

- `docker-compose.yml` - основная конфигурация
- `flowise-fork/entrypoint.sh` - entrypoint скрипт для инициализации БД
- `flowise-fork/Dockerfile` - Dockerfile с PostgreSQL клиентом
- `rebuild-flowise.ps1` - скрипт управления
- `flowise-fork/agent-memory/DOCKER_COMMANDS.md` - документация
