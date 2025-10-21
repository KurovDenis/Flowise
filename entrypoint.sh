#!/bin/sh

# ==================================================================================
# 🚀 Flowise Entrypoint Script with Database Initialization
# ==================================================================================
# Этот скрипт инициализирует базу данных PostgreSQL перед запуском Flowise
# ==================================================================================

set -e

echo "🚀 Starting Flowise with database initialization..."

# Функция для ожидания доступности PostgreSQL
wait_for_postgres() {
    echo "⏳ Waiting for PostgreSQL to be ready..."
    
    # Параметры подключения из переменных окружения
    DB_HOST=${DATABASE_HOST:-localhost}
    DB_PORT=${DATABASE_PORT:-5432}
    DB_USER=${DATABASE_USER:-postgres}
    DB_PASSWORD=${DATABASE_PASSWORD:-postgres}
    DB_NAME=${DATABASE_NAME:-flowise}
    
    # Ожидаем доступности PostgreSQL
    until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
        echo "⏳ PostgreSQL is unavailable - sleeping..."
        sleep 2
    done
    
    echo "✅ PostgreSQL is ready!"
}

# Функция для создания базы данных
create_database() {
    echo "🗄️ Checking if database '$DATABASE_NAME' exists..."
    
    # Проверяем, существует ли база данных
    DB_EXISTS=$(PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -lqt | cut -d \| -f 1 | grep -w "$DATABASE_NAME" | wc -l)
    
    if [ "$DB_EXISTS" -eq 0 ]; then
        echo "📝 Creating database '$DATABASE_NAME'..."
        
        # Пытаемся создать базу данных
        if PGPASSWORD="$DATABASE_PASSWORD" createdb -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" "$DATABASE_NAME" 2>/dev/null; then
            echo "✅ Database '$DATABASE_NAME' created successfully!"
        else
            echo "⚠️  Database creation failed, trying alternative method..."
            # Альтернативный способ через SQL
            PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -c "CREATE DATABASE \"$DATABASE_NAME\";" 2>/dev/null || {
                echo "❌ Failed to create database '$DATABASE_NAME'"
                echo "🔧 Trying to fix collation issues..."
                # Исправляем проблемы с collation
                PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -c "ALTER DATABASE template1 REFRESH COLLATION VERSION;" 2>/dev/null || true
                PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -c "ALTER DATABASE postgres REFRESH COLLATION VERSION;" 2>/dev/null || true
                # Повторная попытка создания
                PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -c "CREATE DATABASE \"$DATABASE_NAME\";" || {
                    echo "❌ Still failed to create database. Continuing anyway..."
                }
            }
        fi
    else
        echo "✅ Database '$DATABASE_NAME' already exists!"
    fi
}

# Функция для установки расширений PostgreSQL
setup_extensions() {
    echo "🔧 Setting up PostgreSQL extensions..."
    
    PGPASSWORD="$DATABASE_PASSWORD" psql -h "$DATABASE_HOST" -p "$DATABASE_PORT" -U "$DATABASE_USER" -d "$DATABASE_NAME" -c "
        CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
        CREATE EXTENSION IF NOT EXISTS \"pg_trgm\";
        SELECT 'PostgreSQL extensions installed successfully' as status;
    "
    
    echo "✅ PostgreSQL extensions ready!"
}

# Основная логика
main() {
    # Проверяем, используется ли PostgreSQL
    if [ "$DATABASE_TYPE" = "postgres" ]; then
        echo "🐘 PostgreSQL mode detected"
        
        # Устанавливаем клиент PostgreSQL
        apk add --no-cache postgresql-client
        
        # Ждем доступности PostgreSQL
        wait_for_postgres
        
        # Создаем базу данных
        create_database
        
        # Устанавливаем расширения
        setup_extensions
        
        echo "🎯 Database initialization completed!"
    else
        echo "📁 SQLite mode detected - no database initialization needed"
    fi
    
    # Запускаем Flowise
    echo "🚀 Starting Flowise..."
    exec "$@"
}

# Запускаем основную функцию
main "$@"
