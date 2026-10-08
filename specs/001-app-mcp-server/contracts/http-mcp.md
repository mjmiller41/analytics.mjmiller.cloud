# Contract: Remote Streamable HTTP MCP Endpoint

## Endpoint Overview

- **Route**: `GET`, `POST`, `DELETE`, `OPTIONS` at `/mcp`
- **Full URL**: `https://analytics.mjmiller.cloud/mcp`
- **Protocol**: Model Context Protocol (Streamable HTTP, specification revision 2026-07-28)
- **State**: Stateless per-request dispatch

## Authentication & Headers

```http
POST /mcp HTTP/1.1
Host: analytics.mjmiller.cloud
Content-Type: application/json
Authorization: Bearer umami_<api-key>
```

### Preconditions
1. Server environment variable `MCP_ENABLED=1` is configured. If `MCP_ENABLED` is missing or not `'1'`, the route immediately responds with `404 Not Found`.
2. Valid API key generated in the Admin UI under **Settings → API keys**.

### Responses

#### 200 OK (Successful MCP Tool Dispatch / Initialization)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{ ... structured output ... }"
      }
    ],
    "structuredContent": { ... }
  }
}
```

#### 401 Unauthorized (Missing or Invalid API Key)
```json
{
  "error": "invalid_token",
  "error_description": "Invalid API key."
}
```
Header: `WWW-Authenticate: Bearer realm="Umami MCP", error="invalid_token"`

#### 404 Not Found (MCP Disabled)
Returned when `MCP_ENABLED !== '1'`.
