## LangSmith Analytics (Quick Enablement)

Enable traces
```bash
# flowise-fork/packages/server/.env
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=lsv2_...
LANGCHAIN_PROJECT=evently-agents
```

Restart
```bash
pnpm start
```

Verify
- Execute a chatflow → check https://smith.langchain.com → Traces

Notes
- Free tier sufficient for development
- Tracks tool usage, latency, token costs; enables evals

See also
- ag-ui_docs/EVENTLY_INTEGRATION_README.md (Analytics section)

