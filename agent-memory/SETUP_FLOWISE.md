## Setup Flowise (Local and Docker)

When to use
- First-time setup of Flowise fork with Evently tools
- Reinstall on a new machine or fresh clone

Prerequisites
- Node.js 18+, pnpm installed (`npm i -g pnpm`)
- Docker + Docker Compose (for containerized run)

Local setup (recommended for development)
```bash
cd flowise-fork

# Install deps
pnpm install

# Build all packages (components, server, ui)
pnpm build

# Configure server env
cd packages/server
cp .env.example .env

# Minimal env tweaks
# PORT=3005
# DATABASE_TYPE=sqlite
# DATABASE_PATH=./flowise.db
# LOG_LEVEL=debug

# Start Flowise (from repo root)
cd ../..
pnpm start

# Open UI
# http://localhost:3005
```

Performance tip (Windows/macOS)
```bash
# If build runs out of memory
# PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"; pnpm build
# bash/zsh
export NODE_OPTIONS="--max-old-space-size=4096" && pnpm build
```

Docker setup (production-like)
```bash
cd flowise-fork

# Build & run service
docker-compose -f docker-compose.flowise.yml up -d

# Logs
docker logs evently.flowise -f

# URL
# http://localhost:3005
```

Verify
- UI opens at http://localhost:3005
- Tools visible under category "Evently" (after building custom nodes)

Common errors
- Tools not visible → run `pnpm build`, then `pnpm start`
- 401 Unauthorized → configure Evently API credential and use fresh JWT
- Cannot connect to API → ensure Evently API container is healthy

See also
- ag-ui_docs/EVENTLY_TOOLS_QUICKSTART.md
- ag-ui_docs/START_HERE.md

