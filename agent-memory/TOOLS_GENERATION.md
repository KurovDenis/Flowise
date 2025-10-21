## Generate Evently Tools

When to use
- Create missing Evently tools quickly via generator, or manual template for custom logic

Automatic (recommended)
```bash
cd flowise-fork

# Generate tools
node scripts/generate-tool.js GetAttributes
node scripts/generate-tool.js GetAttribute
node scripts/generate-tool.js UpdateAttribute
node scripts/generate-tool.js DeleteAttribute

# Rebuild and restart
pnpm build
pnpm start
```

Expected
- Tools appear in UI under category "Evently": Get/Create/Update/Delete Attribute

Manual template
```bash
# As reference, copy existing node
cp -r packages/components/nodes/tools/EventlyCreateAttribute \
      packages/components/nodes/tools/EventlyGetAttributes

# Update names and endpoints
# Class: EventlyCreateAttribute → EventlyGetAttributes
# Endpoint: POST /attributes → GET /attributes
# Adjust Zod schema & core.ts

# Rebuild
pnpm build && pnpm start
```

Supported generators
- GetAttributes
- GetAttribute
- UpdateAttribute
- DeleteAttribute

Verify
- UI → Tools → Evently → new nodes present
- Test basic execution with configured credentials

Common errors
- TypeScript errors: ensure file/class names updated consistently
- Node not visible: rebuild `pnpm build`, then restart

See also
- ag-ui_docs/EVENTLY_TOOLS_QUICKSTART.md
- ag-ui_docs/AG_UI_MIGRATION_PLAN.md

