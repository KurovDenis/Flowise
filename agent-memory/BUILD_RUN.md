## Build & Run

When to use
- Rebuilding after adding tools or changing code
- Starting/stopping dev server quickly

Build
```bash
cd flowise-fork

pnpm build
```

If out-of-memory during build
```bash
# PowerShell
$env:NODE_OPTIONS="--max-old-space-size=4096"; pnpm build

# bash/zsh
export NODE_OPTIONS="--max-old-space-size=4096" && pnpm build
```

Run (dev)
```bash
pnpm start
# URL: http://localhost:3005
```

Verify tools loaded
- UI → Tools → category "Evently" shows all Evently nodes

Quick restart
```bash
# Stop with Ctrl+C, then
pnpm start
```

Logs
```bash
tail -f logs/flowise.log
```

See also
- ag-ui_docs/EVENTLY_TOOLS_QUICKSTART.md

