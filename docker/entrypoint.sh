#!/usr/bin/env bash
set -euo pipefail

# Ensure volumes are writable by runtime user
chown -R flowise:nodejs /app || true
mkdir -p /app/database /app/secretkey /app/logs /app/storage
chown -R flowise:nodejs /app/database /app/secretkey /app/logs /app/storage
chmod -R 775 /app/database /app/secretkey /app/logs /app/storage

# Drop privileges and start using dumb-init
exec dumb-init -- su-exec flowise pnpm start


