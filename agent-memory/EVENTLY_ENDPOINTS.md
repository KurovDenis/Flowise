## Evently API Endpoints (Cheat-Sheet)

Attributes
- GET /api/attributevalue/attributes
- GET /api/attributevalue/attributes/{id}
- POST /api/attributevalue/attributes
- PUT /api/attributevalue/attributes/{id}
- DELETE /api/attributevalue/attributes/{id}

Attribute Types
- GET /api/attributevalue/attribute-types
- POST /api/attributevalue/attribute-types

Attribute Groups
- GET /api/attributevalue/attribute-groups
- POST /api/attributevalue/attribute-groups

Object Types
- GET /api/attributevalue/object-types
- POST /api/attributevalue/object-types/{id}/attributes

System Objects
- GET /api/attributevalue/system-objects
- GET /api/attributevalue/system-objects/{id}
- POST /api/attributevalue/system-objects
- PUT /api/attributevalue/system-objects/{id}

Headers
```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Typical params
- dataType: String | Int | Decimal | Bool | DateTime | Enumeration | Reference
- isComputed: boolean; formulaExpression when true

See also
- ag-ui_docs/EVENTLY_INTEGRATION_README.md

