## Test Scenarios (CRUD, RED first)

Purpose
- Fast manual tests to validate tools wiring and API behavior

Create attribute
```
User: Create attribute Product Name with type String and code PROD_NAME
Expect: ✅ Attribute created with ID
```

List attributes
```
User: Show me all attributes
Expect: ✅ Returns list
```

Filter by type
```
User: Show me all Decimal attributes
Expect: ✅ Filters by dataType=Decimal
```

Duplicate code error (RED)
```
User: Create attribute with code EXISTING_CODE
Expect: ❌ Error: Code already exists (handled message)
```

Update attribute
```
User: Update attribute {id} description to "New description"
Expect: ✅ Updated
```

Delete attribute (confirm)
```
User: Delete attribute {id}
Expect: ✅ Deleted after confirmation
```

Notes
- Ensure Evently API credential set on each tool
- For computed attributes require `formulaExpression`

See also
- ag-ui_docs/EVENTLY_INTEGRATION_README.md (test cases)

