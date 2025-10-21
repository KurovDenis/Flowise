## Create Chatflow (Minimal Wiring)

When to use
- Build the first working agent for Evently attribute management

Steps (UI)
1) Open http://localhost:3005 → "+ Add New Chatflow" → name: AttributeValue Agent
2) Drag a Chat Model:
   - ChatOpenAI (gpt-4-turbo) or ChatGoogleGenerativeAI (gemini-2.0-flash-001)
3) Drag Agent: OpenAI Function Agent
4) Drag Tools (Evently category):
   - Create Attribute, Get Attributes, Get Attribute, Update Attribute, Delete Attribute
5) Set Credential on each Evently node: Evently API (URL + JWT)
6) Connect: Chat Model → Agent; all Tools → Agent; Agent → Output

Minimal system prompt
```
You are an assistant for managing attributes in Evently.
Rules:
- Attribute codes must be UNIQUE and UPPERCASE with underscores (e.g., PROD_NAME)
- System attributes cannot be deleted
- Computed attributes require formulaExpression
- Confirm before deletions
```

Verify
- Save Chatflow → Chat →
  - "Create attribute Product Name with type String and code PROD_NAME" → ✅ success
  - "Show me all attributes" → ✅ list

Common errors
- Tools missing → rebuild (`pnpm build`) and restart
- 401 during tool call → refresh JWT and reselect credential

See also
- ag-ui_docs/START_HERE.md
- ag-ui_docs/CHATFLOW_DEPLOYMENT_GUIDE.md

