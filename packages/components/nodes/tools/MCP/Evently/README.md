# Evently MCP Server

MCP (Model Context Protocol) server for Flowise agents to interact with the Evently AttributeValue API.

## Overview

The Evently MCP server provides secure and reliable access to Evently's AttributeValue domain through Flowise agents. It supports all major operations for AttributeTypes, Attributes, AttributeGroups, ObjectTypes, SystemObjects, MeasureUnits, and MeasureUnitGroups.

## Features

- **Resilient HTTP Client**: ✅ Built-in rate limiting (10 concurrent), retry logic (3 attempts with exponential backoff), and circuit breaker patterns (5 failures threshold)
- **JWT Authentication**: ✅ Secure authentication using KeyCloak JWT tokens with automatic expiry detection and refresh flow support
- **Input Validation**: ✅ Comprehensive Zod schema validation for all API inputs
- **Caching**: ✅ Intelligent caching for improved performance (in-memory for dev, Redis for production) with secure token hashing
- **Error Handling**: ✅ Normalized error responses with detailed error messages
- **Observability**: ✅ Built-in metrics tracking, structured logging, and Prometheus-compatible metric export
- **Production Ready**: ✅ All critical bugs fixed, comprehensive test coverage

## Prerequisites

1. **Evently API**: Running Evently API server accessible via HTTP
2. **Keycloak Service Account**: Client ID and Client Secret from Keycloak with appropriate permissions
3. **Flowise**: Flowise installation with MCP support

## Configuration

### 1. Evently API Credentials (Keycloak)

Create an **Evently API (Keycloak)** credential in Flowise with:
- **API URL**: Base URL of your Evently API (e.g., `http://evently.api:8080`, without `/api` suffix)
- **Keycloak Token URL**: Keycloak token endpoint (e.g., `http://evently.identity:8080/realms/evently/protocol/openid-connect/token`)
- **Client ID**: Service Account client ID (e.g., `evently-confidential-client`)
- **Client Secret**: Service Account client secret from Keycloak Admin Console

**Note:** This credential type supports automatic token refresh. Tokens are obtained and refreshed automatically via OAuth2 Client Credentials Flow. No manual token management required!

### 2. MCP Node Configuration

Configure the Evently MCP node with:
- **Available Actions**: Select which tools to enable
- **API Base URL**: Override the base URL if needed
- **Connect Credential**: Select the "Evently API (Keycloak)" credential

## Available Tools

### AttributeTypes
- `get_attribute_types` - Retrieve all attribute types
- `get_attribute_type` - Get specific attribute type by ID
- `create_attribute_type` - Create new attribute type
- `update_attribute_type` - Update existing attribute type
- `delete_attribute_type` - Delete attribute type

### Attributes
- `get_attributes` - Retrieve all attributes
- `get_attribute` - Get specific attribute by ID
- `create_attribute` - Create new attribute
- `update_attribute` - Update existing attribute
- `delete_attribute` - Delete attribute
- `get_attribute_short_names` - Get short names for multiple attributes

### AttributeGroups
- `get_attribute_groups` - Retrieve all attribute groups
- `get_attribute_group` - Get specific attribute group by ID
- `create_attribute_group` - Create new attribute group
- `update_attribute_group` - Update existing attribute group
- `delete_attribute_group` - Delete attribute group

### Enumerations
- `get_enumerations` - Retrieve all enumerations
- `get_enumeration` - Get specific enumeration by ID
- `create_enumeration` - Create new enumeration with optional values

## Example Agent Workflows

### 1. Retrieve All Attribute Types

```
Tool: get_attribute_types
Input: {}
Output: Array of attribute type objects
```

### 2. Create New Attribute Type

```
Tool: create_attribute_type
Input: {
  "name": "Email Address",
  "description": "Email address field",
  "dataType": "String"
}
Output: UUID of created attribute type
```

### 3. Get Attribute with Short Names

```
Tool: get_attribute_short_names
Input: {
  "ids": ["uuid1", "uuid2", "uuid3"]
}
Output: Array of short name objects
```

## Error Handling

The MCP server provides detailed error information:

- **Authentication Errors (401)**: Invalid or expired JWT token
- **Authorization Errors (403)**: Insufficient permissions for the operation
- **Not Found Errors (404)**: Resource doesn't exist
- **Validation Errors (422)**: Invalid input data
- **Server Errors (5xx)**: Evently API server issues

## Troubleshooting

### Common Issues

1. **"Auth token is missing"**
   - Verify JWT token is correctly configured in credentials
   - Check token hasn't expired

2. **"API Error 403"**
   - Ensure JWT token has required permissions for the operation
   - Check KeyCloak role assignments

3. **"Network error: Unable to reach Evently API"**
   - Verify Evently API is running and accessible
   - Check API URL configuration
   - Ensure network connectivity

4. **"Circuit Breaker opened"**
   - Too many API failures detected
   - Check Evently API health
   - Wait for circuit breaker to reset (60 seconds)

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=evently-mcp
```

## Architecture

The Evently MCP server uses a layered architecture:

1. **MCP Protocol Layer**: Handles MCP protocol communication
2. **Validation Layer**: Input validation using Zod schemas
3. **HTTP Client Layer**: Resilient HTTP client with retry/circuit breaker
4. **Authentication Layer**: JWT token management
5. **Cache Layer**: Performance optimization through caching

## Security

- All API calls use HTTPS in production
- JWT tokens are never logged or exposed
- Input validation prevents injection attacks
- Rate limiting prevents API abuse
- Circuit breaker prevents cascading failures

## Performance

- **Rate Limiting**: ✅ Maximum 10 concurrent requests with queue management
- **Caching**: ✅ 5-minute cache for tool discovery with SHA-256 token hashing
- **Retry Logic**: ✅ 3 attempts with exponential backoff (1s, 2s, 4s delays)
- **Circuit Breaker**: ✅ Automatic failure detection (5 failures threshold) and recovery (60s timeout)
- **Metrics**: ✅ Request duration tracking, error rate monitoring, cache hit ratio
- **Logging**: ✅ Structured JSON logs with trace IDs for correlation

## Development

### Running Tests

```bash
# All tests
npm test -- --testPathPattern="Evently"

# Unit tests only
npm test -- --testPathPattern="AuthManager|EventlyApiClient|ValidationSuite"

# Integration tests (requires running Evently API)
EVENTLY_API_URL=http://localhost:5000 EVENTLY_JWT_TOKEN=your-token npm test -- --testPathPattern="IntegrationTests"
```

### Building

```bash
npm run build
```

### Type Generation

```bash
npm run gen:evently-types
```

### Debug Mode

Enable detailed logging:
```bash
DEBUG=evently-mcp npm start
```

### Monitoring Metrics

```javascript
import { getObservabilityProvider } from './core/ObservabilityProvider'

const observability = getObservabilityProvider()

// Get metrics summary
const metrics = observability.getMetricsSummary()
console.log(metrics)

// Export Prometheus format
const prometheusMetrics = observability.exportPrometheusMetrics()
console.log(prometheusMetrics)

// Get recent logs
const logs = observability.getRecentLogs(100, 'error')
console.log(logs)
```

## Roadmap

### ✅ Completed (v1.0)
- AttributeTypes, Attributes, AttributeGroups tools (15 tools)
- Resilience patterns (rate limiting, retry, circuit breaker)
- JWT authentication with refresh flow
- Observability (metrics, logging)
- Integration tests
- Security improvements

### 🔜 Planned (v1.1)
- ObjectTypes tools (5 additional tools)
- SystemObjects tools (5 additional tools)
- MeasureUnits tools (5 additional tools)
- MeasureUnitGroups tools (5 additional tools)

**See [FUTURE_TOOLS.md](./FUTURE_TOOLS.md) for detailed roadmap**

**Note:** Additional tools are blocked pending Evently API implementation

---

## Support

For issues and questions:
- Check Evently API documentation
- Review Flowise MCP documentation
- Check server logs for detailed error information
- Enable DEBUG mode for verbose logging: `DEBUG=evently-mcp`
- View metrics: `observability.getMetricsSummary()`
