## Troubleshooting (By Symptom)

Tools not visible in UI
```bash
pnpm build
pnpm start
```
- Ensure nodes exist under packages/components/nodes/tools/*

401 Unauthorized when running tool
- Refresh JWT from AG-UI → update credential
- Re-run the tool

ECONNREFUSED / timeout to Evently API
```bash
docker ps | grep evently.api
curl http://localhost:8080/api/attributevalue/attributes
```
- Ensure API container is healthy and reachable from Flowise

Duplicate chatflow name on import
- Delete old chatflow in UI or via API
- Or rename `name` in JSON before import

Build fails: out of memory
```bash
# PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"; pnpm build
# bash/zsh
export NODE_OPTIONS="--max-old-space-size=4096" && pnpm build
```

Flowise not starting (Docker)
```bash
docker logs evently.flowise --tail 100
docker-compose -f docker-compose.flowise.yml restart evently.flowise
```

See also
- ag-ui_docs/EVENTLY_TOOLS_QUICKSTART.md (Troubleshooting section)
- ag-ui_docs/CHATFLOW_DEPLOYMENT_GUIDE.md

