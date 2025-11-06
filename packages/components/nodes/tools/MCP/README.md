# Evently MCP Servers

Model Context Protocol (MCP) servers for Flowise agents to interact with the Evently API.

## Overview

The Evently MCP integration provides secure and reliable access to Evently's domain APIs through Flowise agents. The architecture supports both monolithic and modular server configurations, enabling flexible deployment based on agent requirements.

## Architecture

### Modular Architecture (Recommended)

The Evently MCP functionality is split into four independent domain servers:

- **Evently.Attributes** - 17 attribute-related tools (attribute types, attributes, attribute groups)
- **Evently.Enumerations** - 8 enumeration-related tools (enumerations and values)
- **Evently.Objects** - 10 object-related tools (object types, system objects)
- **Evently.Measures** - 10 measure-related tools (measure unit groups, measure units)

**Benefits:**
- 30-40% memory reduction when using single-domain agents
- Independent deployment and versioning per domain
- Granular access control per agent role
- Faster development cycles per domain
- Better scalability and maintainability

### Monolithic Architecture (Legacy)

The **Evently** server provides all tools in a single process, suitable for agents requiring access to all domains.

**Status:** ✅ Maintained and fully functional. See [Evently/README.md](./Evently/README.md) for details.

## Quick Start

### Modular Servers

1. **Configure environment variables:**
   ```bash
   KEYCLOAK_TOKEN_URL=http://evently.identity:8080/realms/evently/protocol/openid-connect/token
   EVENTLY_API_URL=http://evently.api:8080
   KEYCLOAK_CLIENT_ID=evently-attributes-client
   KEYCLOAK_CLIENT_SECRET=your-secret
   ```

2. **Start a server:**
   ```bash
   # Attributes server
   node Evently.Attributes/server.js
   
   # Enumerations server
   node Evently.Enumerations/server.js
   
   # Objects server
   node Evently.Objects/server.js
   
   # Measures server
   node Evently.Measures/server.js
   ```

3. **Configure in Flowise:**
   ```json
   {
     "mcpServers": [
       {
         "name": "evently-attributes",
         "command": "node",
         "args": ["path/to/Evently.Attributes/server.js"]
       }
     ]
   }
   ```

### Monolithic Server

See [Evently/README.md](./Evently/README.md) for detailed instructions.

## Shared Infrastructure

All Evently MCP servers share common infrastructure located in the `shared/` directory:

- **AuthManager** - Keycloak authentication and token management
- **EventlyApiClient** - Resilient HTTP client with retry and circuit breaker
- **CacheProvider** - In-memory caching for performance optimization
- **ObservabilityProvider** - Structured logging and metrics
- **MCPServerBase** - Base class for MCP server implementation
- **Error Handling** - Standardized error handling utilities
- **Configuration Loader** - Environment variable configuration

## Server Details

### Evently.Attributes

**Tools:** 17 tools for managing attributes, attribute types, and attribute groups.

**Documentation:** See [Evently.Attributes/README.md](./Evently.Attributes/README.md) (if available)

**Key Tools:**
- `get_attribute_types`, `get_attribute_type`, `create_attribute_type`, `update_attribute_type`, `delete_attribute_type`
- `get_attributes`, `get_attribute`, `get_attribute_by_code`, `create_attribute`, `update_attribute`, `delete_attribute`
- `get_attribute_groups`, `get_attribute_group`, `create_attribute_group`, `update_attribute_group`, `delete_attribute_group`

### Evently.Enumerations

**Tools:** 8 tools for managing enumerations and enumeration values.

**Documentation:** See [Evently.Enumerations/README.md](./Evently.Enumerations/README.md) (if available)

**Key Tools:**
- `get_enumerations`, `get_enumeration`, `create_enumeration`, `update_enumeration`, `delete_enumeration`
- `add_enumeration_value`, `update_enumeration_value`, `delete_enumeration_value`

### Evently.Objects

**Tools:** 10 tools for managing object types and system objects.

**Documentation:** See [Evently.Objects/README.md](./Evently.Objects/README.md) (if available)

**Key Tools:**
- `get_object_types`, `get_object_type`, `update_object_type`
- `get_system_objects`, `get_system_object`, `create_system_object`, `update_system_object`, `delete_system_object`

### Evently.Measures

**Tools:** 10 tools for managing measure unit groups and measure units.

**Documentation:** See [Evently.Measures/README.md](./Evently.Measures/README.md) (if available)

**Key Tools:**
- `get_measure_unit_groups`, `create_measure_unit_group`, `update_measure_unit_group`, `delete_measure_unit_group`
- `get_measure_units`, `get_measure_unit`, `create_measure_unit`, `update_measure_unit`, `delete_measure_unit`

## Configuration

### Environment Variables

All servers require the following environment variables:

- `KEYCLOAK_TOKEN_URL` - Keycloak token endpoint URL
- `EVENTLY_API_URL` - Evently API base URL (without `/api` suffix)
- `KEYCLOAK_CLIENT_ID` - Keycloak client ID for authentication
- `KEYCLOAK_CLIENT_SECRET` - Keycloak client secret

### Agent Configuration

Agents can be configured with one or more MCP servers:

```json
{
  "mcpServers": [
    {
      "name": "evently-attributes",
      "command": "node",
      "args": ["path/to/Evently.Attributes/server.js"],
      "env": {
        "KEYCLOAK_TOKEN_URL": "...",
        "EVENTLY_API_URL": "...",
        "KEYCLOAK_CLIENT_ID": "...",
        "KEYCLOAK_CLIENT_SECRET": "..."
      }
    },
    {
      "name": "evently-enumerations",
      "command": "node",
      "args": ["path/to/Evently.Enumerations/server.js"],
      "env": {
        "KEYCLOAK_TOKEN_URL": "...",
        "EVENTLY_API_URL": "...",
        "KEYCLOAK_CLIENT_ID": "...",
        "KEYCLOAK_CLIENT_SECRET": "..."
      }
    }
  ]
}
```

**Tool Conflict Resolution:** When multiple servers provide tools with the same name, the first configured server wins (handled by Flowise).

## Migration

### From Monolithic to Modular

See [MIGRATION_GUIDE.md](../../../../../../specs/001-mcp-modularization/MIGRATION_GUIDE.md) for detailed migration instructions.

**Quick Migration Steps:**
1. Identify which domains your agent uses
2. Configure the corresponding modular server(s)
3. Test the agent with the new configuration
4. Remove the monolithic server configuration

## Development

### Project Structure

```
MCP/
├── Evently/              # Monolithic server (legacy, maintained)
│   ├── EventlyMCP.ts     # Flowise node wrapper
│   ├── index.ts          # Export for Flowise registration
│   └── server.ts         # Standalone MCP server
├── Evently.Attributes/   # Attributes domain server
│   ├── AttributesMCP.ts  # Flowise node wrapper
│   ├── index.ts          # Export for Flowise registration
│   └── server.ts         # Standalone MCP server
├── Evently.Enumerations/ # Enumerations domain server
│   ├── EnumerationsMCP.ts # Flowise node wrapper
│   ├── index.ts          # Export for Flowise registration
│   └── server.ts         # Standalone MCP server
├── Evently.Objects/      # Objects domain server
│   ├── ObjectsMCP.ts     # Flowise node wrapper
│   ├── index.ts          # Export for Flowise registration
│   └── server.ts         # Standalone MCP server
├── Evently.Measures/     # Measures domain server
│   ├── MeasuresMCP.ts    # Flowise node wrapper
│   ├── index.ts          # Export for Flowise registration
│   └── server.ts         # Standalone MCP server
└── shared/               # Shared infrastructure
    ├── core/             # Core components (AuthManager, ApiClient, etc.)
    ├── types/            # Shared TypeScript types
    └── utils/            # Utility functions
```

### Building

```bash
# Build all servers
cd flowise-fork/packages/components
npm run build

# After building, restart Flowise to see new MCP nodes in UI
```

### Registering New Nodes

Each modular MCP server has two components:

1. **Flowise Node Wrapper** (`*MCP.ts`) - Integrates with Flowise UI
2. **Standalone Server** (`server.ts`) - Can run independently via stdio

After creating a new MCP server, you must:

1. Create a Flowise node wrapper implementing `INode` interface
2. Create an `index.ts` file exporting the node class
3. Add an icon file (`.svg`)
4. Rebuild Flowise: `npm run build`
5. Restart Flowise

### Testing

```bash
# Run tests for a specific server
npm test -- --testPathPattern="Evently.Attributes"

# Run all Evently tests
npm test -- --testPathPattern="Evently"
```

## Versioning

Each modular server uses independent semantic versioning:

- **Evently.Attributes**: v1.0.0
- **Evently.Enumerations**: v1.0.0
- **Evently.Objects**: v1.0.0
- **Evently.Measures**: v1.0.0

See [VERSIONING.md](../../../../../../specs/001-mcp-modularization/VERSIONING.md) for versioning strategy details.

## Performance

### Memory Usage

- **Monolithic server**: ~X MB (all domains)
- **Single modular server**: ~Y MB (30-40% reduction)
- **All modular servers**: ~Z MB (similar to monolithic)

### Latency

- **Target**: < 200ms p95 tool latency
- **Caching**: In-memory LRU cache for read-heavy operations
- **Retry Logic**: 3 attempts with exponential backoff
- **Circuit Breaker**: 5 failures threshold, 60s timeout

## Security

- **Authentication**: Keycloak OAuth2 Client Credentials Flow
- **Token Management**: Automatic token refresh
- **Secrets**: Environment variables only (no hardcoded secrets)
- **Input Validation**: Zod schema validation for all inputs
- **HTTPS**: Required in production environments

## Observability

- **Logging**: Structured JSON logs with correlation IDs
- **Metrics**: Request duration, error rates, cache hit ratios
- **Health Checks**: Startup logging with version and tool count
- **Error Handling**: Standardized error responses with Problem Details (RFC 7807)

## Support

### Documentation

- **Specification**: [specs/001-mcp-modularization/spec.md](../../../../../../specs/001-mcp-modularization/spec.md)
- **Implementation Plan**: [specs/001-mcp-modularization/plan.md](../../../../../../specs/001-mcp-modularization/plan.md)
- **Migration Guide**: [specs/001-mcp-modularization/MIGRATION_GUIDE.md](../../../../../../specs/001-mcp-modularization/MIGRATION_GUIDE.md)
- **API Contracts**: [specs/001-mcp-modularization/contracts/](../../../../../../specs/001-mcp-modularization/contracts/)

### Troubleshooting

1. **Check server logs** for detailed error information
2. **Verify environment variables** are correctly set
3. **Check Keycloak credentials** and permissions
4. **Verify Evently API** is accessible and running
5. **Enable debug logging**: `DEBUG=evently-mcp`

## License

See project root LICENSE file.

---

**Last Updated:** 2025-01-27  
**Version:** 1.0

