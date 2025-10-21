#!/bin/bash

###############################################################################
# Flowise Chatflows Auto-Import Script
#
# Используется в Docker контейнере для автоматического импорта chatflows
# при первом запуске.
#
# Usage:
#   В docker-compose.yml добавить:
#     volumes:
#       - ./chatflows:/app/chatflows:ro
#       - ./docker/init-chatflows.sh:/app/init-chatflows.sh:ro
#     command: >
#       sh -c "
#         npm start &
#         sleep 10 &&
#         node /app/scripts/import-chatflows.js &&
#         wait
#       "
###############################################################################

echo "🚀 Flowise Chatflows Auto-Import"
echo "================================"
echo ""

# Переменные окружения
FLOWISE_URL="${FLOWISE_URL:-http://localhost:3000}"
CHATFLOWS_DIR="${CHATFLOWS_DIR:-/app/chatflows}"

# Проверка существования директории
if [ ! -d "$CHATFLOWS_DIR" ]; then
  echo "⚠️  Chatflows directory not found: $CHATFLOWS_DIR"
  echo "   Skipping import."
  exit 0
fi

# Подсчет файлов
CHATFLOW_COUNT=$(find "$CHATFLOWS_DIR" -name "*.json" -type f | wc -l)

if [ "$CHATFLOW_COUNT" -eq 0 ]; then
  echo "⚠️  No chatflow files found in $CHATFLOWS_DIR"
  echo "   Skipping import."
  exit 0
fi

echo "📦 Found $CHATFLOW_COUNT chatflow file(s)"
echo ""

# Дождаться запуска Flowise
echo "⏳ Waiting for Flowise to start..."
ATTEMPT=0
MAX_ATTEMPTS=30

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s -f "$FLOWISE_URL/api/v1/chatflows" > /dev/null 2>&1; then
    echo "✅ Flowise is ready!"
    break
  fi
  
  ATTEMPT=$((ATTEMPT + 1))
  echo -n "."
  sleep 2
done

echo ""

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Flowise did not start in time (60s timeout)"
  exit 1
fi

# Запуск импорта
echo ""
echo "🔄 Importing chatflows..."
echo ""

cd /app
node scripts/import-chatflows.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "🎉 Chatflows imported successfully!"
else
  echo ""
  echo "❌ Import failed with exit code $EXIT_CODE"
fi

exit $EXIT_CODE

