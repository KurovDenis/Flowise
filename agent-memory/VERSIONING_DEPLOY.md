## Chatflow Versioning & Deployment

When to use
- Keep chatflows in git and auto-import on deploy

Export (dev)
```bash
cd flowise-fork
# Export all chatflows from DB to chatflows/*.json
node scripts/export-chatflows.js

git add chatflows/
git commit -m "chore: export chatflows"
```

Import (dev manual)
```bash
pnpm start &
node scripts/import-chatflows.js
```

Auto-import (Docker deploy)
```bash
cd flowise-fork
docker-compose -f docker-compose.flowise.yml up -d
# Container runs docker/init-chatflows.sh to import chatflows/*.json
```

Check
```bash
curl http://localhost:3005/api/v1/chatflows | jq '.[] | {name, type, deployed}'
```

Common pitfalls
- Duplicate names → delete old chatflow or rename `name` in JSON
- Do not store credentials inside JSON; use Flowise Credentials
- Avoid manual edits of `flowData` (use UI to change, then export)

Update flow
```bash
# Change in UI → export again
node scripts/export-chatflows.js
git commit && git push

# Production: remove old via UI or API, then re-import
curl -X DELETE http://localhost:3005/api/v1/chatflows/{id}
node scripts/import-chatflows.js
```

See also
- ag-ui_docs/CHATFLOW_DEPLOYMENT_GUIDE.md
- ag-ui_docs/CHATFLOW_VERSIONING_GUIDE.md

